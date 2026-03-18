"use server";

import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { runMonitoringCycle } from "@/lib/monitoring-worker";
import { resolveFlightInstance } from "@/lib/flight-service";

export async function createTripAndRedirect(formData: FormData) {

  const flight1Number = formData.get("flight1Number") as string;
  const flight2Number = formData.get("flight2Number") as string;

  const originAirport = formData.get("originAirport") as string;
  const connectionAirport = formData.get("connectionAirport") as string;
  const destinationAirport = formData.get("destinationAirport") as string;

  const date = formData.get("date") as string;

  const f1 = await resolveFlightInstance(originAirport, flight1Number, date);
  const f2 = await resolveFlightInstance(connectionAirport, flight2Number, date);

  // ✅ CRITICAL FIX
  if (!f1 || !f2) {
    throw new Error("Could not resolve flight(s). Check flight number + date.");
  }

  // ✅ safe variables (fixes TS error cleanly)
  const flight1 = f1;
  const flight2 = f2;

  const { data, error } = await supabase
    .from("trips")
    .insert({
      flight_1_number: flight1Number,
      flight_2_number: flight2Number,

      origin_airport: originAirport,
      connection_airport: connectionAirport,
      destination_airport: destinationAirport,

      scheduled_departure_f1: flight1.scheduledDeparture,
      scheduled_arrival_f1: flight1.scheduledArrival,
      
      scheduled_departure_f2: flight2.scheduledDeparture,
      scheduled_arrival_f2: flight2.scheduledArrival,

      monitoring_state: "safe",
      status: "active"
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message || "Failed to create trip.");
  }

  // ✅ run AFTER insert succeeds
  await runMonitoringCycle();

  redirect(`/trip/${data.id}`);
}