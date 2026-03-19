"use server";

import { supabase } from "@/lib/supabase";
import { getFlightStatus } from "@/lib/flight-service";
import { calculateConnectionRisk } from "@/lib/risk-engine";
import type { TripRow, RiskEventRow, LandingPlanRow } from "@/types/database";
import { generateRecoveryPlan } from "@/lib/recovery-engine";
import { getMCT } from "@/lib/mct";
import { parseLocalTime } from "@/lib/time";

type MonitoringSummary = {
  tripsProcessed: number;
  stateChanges: number;
};

let lastRun = 0;

export async function runMonitoringCycle(): Promise<MonitoringSummary> {
  const now = Date.now();

  // ✅ Rate limiter
  if (now - lastRun < 60000) {
    console.log("Skipping — ran too recently");
    return { tripsProcessed: 0, stateChanges: 0 };
  }

  lastRun = now;

  console.log("RUN MONITOR:", new Date().toISOString());

  await supabase.from("debug_logs").insert({
    message: "MONITOR STARTED",
    created_at: new Date().toISOString()
  });

  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "active");

  if (error || !trips || trips.length === 0) {
    return { tripsProcessed: 0, stateChanges: 0 };
  }

  console.log("Trips found:", trips.length);

  let tripsProcessed = 0;
  let stateChanges = 0;

  for (const trip of trips as TripRow[]) {
    console.log("TRIP DEBUG", {
      id: trip.id,
      dep2: trip.scheduled_departure_f2,
      arr1: trip.scheduled_arrival_f1
    });

    if (!trip.flight_1_number || !trip.flight_2_number) continue;

    tripsProcessed++;

    // ✅ Fetch flight status
    const [statusF1, statusF2] = await Promise.all([
      getFlightStatus(
        trip.flight_1_number,
        trip.origin_airport,
        trip.connection_airport
      ),
      getFlightStatus(
        trip.flight_2_number,
        trip.connection_airport,
        trip.destination_airport
      )
    ]);

    // ✅ HARD FALLBACKS (never null)
    const finalArrivalF1 =
      statusF1?.actualArrival ??
      statusF1?.estimatedArrival ??
      trip.scheduled_arrival_f1;

    const finalDepartureF2 =
      statusF2?.actualDeparture ??
      statusF2?.estimatedDeparture ??
      trip.scheduled_departure_f2;

    if (!finalArrivalF1 || !finalDepartureF2) {
      console.log("❌ NO VALID TIMES", {
        trip: trip.id,
        statusF1,
        statusF2
      });
      continue;
    }

    // ✅ SAFE PARSING
    const arrivalMs = parseLocalTime(finalArrivalF1);
    const departureMs = parseLocalTime(finalDepartureF2);

    // ✅ PROPER validation (no falsy check)
    if (arrivalMs === null || departureMs === null) {
      console.log("❌ PARSE NULL", {
        trip: trip.id,
        finalArrivalF1,
        finalDepartureF2
      });
      continue;
    }

    if (Number.isNaN(arrivalMs) || Number.isNaN(departureMs)) {
      console.log("❌ PARSE FAILED", {
        trip: trip.id,
        finalArrivalF1,
        finalDepartureF2
      });
      continue;
    }

    // ✅ Compute connection margin
    const connectionMinutes = Math.floor(
      (departureMs - arrivalMs) / 60000
    );

    const mctMinutes = getMCT(
      trip.connection_airport,
      trip.destination_airport
    );

    const risk = calculateConnectionRisk(
      Math.floor(arrivalMs / 1000),
      Math.floor(departureMs / 1000),
      mctMinutes
    );

    const previousState = trip.monitoring_state ?? "safe";
    const newState = risk.state;

    console.log("FINAL TIMES", {
      scheduled: trip.scheduled_departure_f2,
      estimated: trip.estimated_departure_f2,
      status: statusF2?.estimatedDeparture,
      chosen: finalDepartureF2
    });

    // ✅ SINGLE CLEAN UPDATE
    await supabase
      .from("trips")
      .update({
        estimated_arrival_f1: finalArrivalF1,
        estimated_departure_f2: finalDepartureF2,
        monitoring_state: newState,
        connection_time_remaining: connectionMinutes
      })
      .eq("id", trip.id);

    if (previousState !== newState) {
      stateChanges++;
    }

    await supabase.from("debug_logs").insert({
      message: `UPDATED STATE: ${newState}, margin=${connectionMinutes}`,
      created_at: new Date().toISOString()
    });

    await supabase.from("risk_events").insert({
      trip_id: trip.id,
      previous_state: previousState,
      new_state: newState,
      connection_time_remaining: connectionMinutes
    } satisfies Partial<RiskEventRow>);

    // ✅ Recovery triggers
    if (previousState !== "likely_missed" && newState === "likely_missed") {
      const options = await generateRecoveryPlan(
        trip.connection_airport,
        trip.destination_airport,
        finalArrivalF1,
        trip.flight_2_number
      );

      await supabase.from("landing_plans").insert({
        trip_id: trip.id,
        created_at: new Date().toISOString(),
        reason: "connection risk",
        options
      } satisfies Partial<LandingPlanRow>);
    }

    if (previousState !== "impossible" && newState === "impossible") {
      const options = await generateRecoveryPlan(
        trip.connection_airport,
        trip.destination_airport,
        finalArrivalF1,
        trip.flight_2_number
      );

      await supabase.from("landing_plans").insert({
        trip_id: trip.id,
        created_at: new Date().toISOString(),
        reason: "connection impossible",
        options
      });
    }
  }

  return { tripsProcessed, stateChanges };
}