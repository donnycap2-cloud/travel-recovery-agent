"use server";

import { supabase } from "@/lib/supabase";
import { getFlightStatus } from "@/lib/flight-service";
import { calculateConnectionRisk } from "@/lib/risk-engine";
import type { TripRow, RiskEventRow, LandingPlanRow } from "@/types/database";

type MonitoringSummary = {
  tripsProcessed: number;
  stateChanges: number;
};

function toEpochSeconds(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

export async function runMonitoringCycle(): Promise<MonitoringSummary> {
  const windowEnd = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "active")
    .lte("scheduled_departure_f1", windowEnd);

  if (error || !trips || trips.length === 0) {
    return { tripsProcessed: 0, stateChanges: 0 };
  }

  let stateChanges = 0;

  for (const raw of trips as TripRow[]) {
    const trip = raw;

    if (!trip.flight_id_f1 || !trip.flight_id_f2 || !trip.scheduled_departure_f2) {
      continue;
    }

    // 2. Fetch status for both legs
    const [statusF1, statusF2] = await Promise.all([
      getFlightStatus(trip.flight_id_f1),
      getFlightStatus(trip.flight_id_f2)
    ]);

    // 3. Determine estimated arrival for flight 1
    // Prefer: arr_actual -> arr_estimated -> arr_time.
    // Our flight-status helper exposes only estimated; fall back to scheduled from trip.
    const estimatedArrivalF1Seconds =
      toEpochSeconds(statusF1?.estimatedArrival ?? null) ??
      toEpochSeconds(trip.estimated_arrival_f1) ??
      toEpochSeconds(trip.scheduled_arrival_f1);

    // 4. Scheduled departure of flight 2 from DB
    const scheduledDepartureF2Seconds = toEpochSeconds(trip.scheduled_departure_f2);

    if (estimatedArrivalF1Seconds == null || scheduledDepartureF2Seconds == null) {
      continue;
    }

    // 5. Run risk calculation. For now, assume a 60-minute MCT.
    const mctMinutes = 60;
    const risk = calculateConnectionRisk(
      estimatedArrivalF1Seconds,
      scheduledDepartureF2Seconds,
      mctMinutes
    );

    const previousState = (trip.monitoring_state as string | null) ?? "safe";
    const newState = risk.state;

    if (previousState === newState && trip.connection_time_remaining === risk.connectionTimeRemaining) {
      continue;
    }

    stateChanges += previousState === newState ? 0 : 1;

    // 7. Insert risk_events entry
    await supabase.from("risk_events").insert({
      trip_id: trip.id,
      previous_state: previousState,
      new_state: newState,
      connection_time_remaining: risk.connectionTimeRemaining
    } satisfies Partial<RiskEventRow>);

    // 8. Update trip monitoring_state + connection_time_remaining
    await supabase
      .from("trips")
      .update({
        monitoring_state: newState,
        connection_time_remaining: risk.connectionTimeRemaining
      })
      .eq("id", trip.id);

    // 9–10. Landing plan actions
    if (newState === "likely_missed") {
      await supabase.from("landing_plans").insert({
        trip_id: trip.id,
        created_at: new Date().toISOString(),
        reason: "connection risk"
      } satisfies Partial<LandingPlanRow>);
    } else if (newState === "impossible") {
      // Update most recent landing plan for this trip, or create one if none exist.
      const { data: existingPlans } = await supabase
        .from("landing_plans")
        .select("id")
        .eq("trip_id", trip.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (existingPlans && existingPlans.length > 0) {
        await supabase
          .from("landing_plans")
          .update({ reason: "connection impossible" })
          .eq("id", existingPlans[0]!.id);
      } else {
        await supabase.from("landing_plans").insert({
          trip_id: trip.id,
          created_at: new Date().toISOString(),
          reason: "connection impossible"
        } satisfies Partial<LandingPlanRow>);
      }
    }
  }

  return { tripsProcessed: trips.length, stateChanges };
}

