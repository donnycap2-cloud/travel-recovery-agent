"use server";

import { supabase } from "@/lib/supabase";
import { getFlightStatus } from "@/lib/flight-service";
import { calculateConnectionRisk } from "@/lib/risk-engine";
import type { TripRow, RiskEventRow, LandingPlanRow } from "@/types/database";
import { generateRecoveryPlan } from "@/lib/recovery-engine";
import { getMCT } from "@/lib/mct";
import { parseAirportTime } from "./timezones";

type MonitoringSummary = {
  tripsProcessed: number;
  stateChanges: number;
};

function toEpochSeconds(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

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



  const windowStart = new Date(now - 12 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(now + 12 * 60 * 60 * 1000).toISOString();
  
  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "active")


  if (error || !trips || trips.length === 0) {
    return { tripsProcessed: 0, stateChanges: 0 };
  }

  console.log("Trips found:", trips.length);

  await supabase.from("debug_logs").insert({
    message: `TRIPS FOUND: ${trips.length}`,
    created_at: new Date().toISOString()
  });

  let tripsProcessed = 0;
  let stateChanges = 0;

  for (const trip of trips as TripRow[]) {

    console.log("TRIP DEBUG", {
      id: trip.id,
      dep2: trip.scheduled_departure_f2,
      arr1: trip.scheduled_arrival_f1
    });

    if (!trip.flight_1_number || !trip.flight_2_number) {
      continue;
    }

    tripsProcessed++;

    // Fetch status
    const [statusF1, statusF2] = await Promise.all([
      getFlightStatus(trip.flight_1_number),
      getFlightStatus(trip.flight_2_number)
    ]);

    const estimatedArrivalF1 =
    statusF1?.actualArrival ??
    statusF1?.estimatedArrival ??
    trip.estimated_arrival_f1 ??
    trip.scheduled_arrival_f1;
  
  const estimatedDepartureF2 =
    statusF2?.actualDeparture ??
    statusF2?.estimatedDeparture ??
    trip.estimated_departure_f2 ??
    trip.scheduled_departure_f2;

    await supabase
      .from("trips")
      .update({
        estimated_arrival_f1: estimatedArrivalF1,
        estimated_departure_f2: estimatedDepartureF2
      })
      .eq("id", trip.id);

      const arrivalF1Seconds = parseAirportTime(
        estimatedArrivalF1,
        trip.connection_airport
      );
      
      const departureF2Seconds = parseAirportTime(
        estimatedDepartureF2,
        trip.connection_airport
      );

    if (arrivalF1Seconds == null || departureF2Seconds == null) {
      continue;
    }

    const mctMinutes = getMCT(
      trip.connection_airport,
      trip.destination_airport
    );

    const risk = calculateConnectionRisk(
      arrivalF1Seconds,
      departureF2Seconds,
      mctMinutes
    );

    const previousState = trip.monitoring_state ?? "safe";
    const newState = risk.state;

    // Always update BOTH
    await supabase
      .from("trips")
      .update({
        monitoring_state: newState,
        connection_time_remaining: risk.connectionTimeRemaining
      })
      .eq("id", trip.id);

      if (previousState !== newState) {
        stateChanges++;
      }

    await supabase.from("debug_logs").insert({
      message: `UPDATED STATE: ${newState}, margin=${risk.connectionTimeRemaining}`,
      created_at: new Date().toISOString()
    });

    await supabase.from("risk_events").insert({
      trip_id: trip.id,
      previous_state: previousState,
      new_state: newState,
      connection_time_remaining: risk.connectionTimeRemaining
    } satisfies Partial<RiskEventRow>);



    if (previousState !== "likely_missed" && newState === "likely_missed") {
      const options = await generateRecoveryPlan(
        trip.connection_airport,
        trip.destination_airport,
        estimatedArrivalF1,
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
        estimatedArrivalF1,
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