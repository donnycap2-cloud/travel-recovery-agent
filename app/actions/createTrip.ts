"use server";

import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function createTripAndRedirect(args: {
  flight1Number: string;
  flight2Number: string;
  originAirport: string;
  connectionAirport: string;
  destinationAirport: string;

  scheduledDepartureF1: string | null;
  scheduledArrivalF1: string | null;

  scheduledDepartureF2: string | null;
  scheduledArrivalF2: string | null;
}) {

  const {
    flight1Number,
    flight2Number,
    originAirport,
    connectionAirport,
    destinationAirport,
    scheduledDepartureF1,
    scheduledArrivalF1,
    scheduledDepartureF2,
    scheduledArrivalF2
  } = args;

  function normalizeTimestamp(value: string | null) {
    if (!value) return null;
  
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString();
  
    return null;
  }

  console.log("Creating trip with:", {
    scheduledDepartureF1,
    scheduledArrivalF1,
    scheduledDepartureF2,
    scheduledArrivalF2
  });

  const { data, error } = await supabase
    .from("trips")
    .insert({
      flight_1_number: flight1Number,
      flight_2_number: flight2Number,

      origin_airport: originAirport,
      connection_airport: connectionAirport,
      destination_airport: destinationAirport,

      scheduled_departure_f1: scheduledDepartureF1,
      scheduled_arrival_f1: scheduledArrivalF1,
    
      scheduled_departure_f2: scheduledDepartureF2,
      scheduled_arrival_f2: scheduledArrivalF2,

      monitoring_state: "safe",
      status: "active"
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message || "Failed to create trip.");
  }

  redirect(`/trip/${data.id}`);
}