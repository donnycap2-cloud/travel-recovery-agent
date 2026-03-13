"use server";

import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { resolveFlightInstance } from "@/lib/flight-service";

export async function createTripAndRedirect(args: {
  flight1Number: string;
  flight2Number: string;
  originAirport: string;
  connectionAirport: string;
  destinationAirport: string;
}) {
  const {
    flight1Number,
    flight2Number,
    originAirport,
    connectionAirport,
    destinationAirport
  } = args;

  const airline1 = flight1Number.slice(0, 2);
  const number1 = flight1Number.slice(2);

  const airline2 = flight2Number.slice(0, 2);
  const number2 = flight2Number.slice(2);

  const flight1 = await resolveFlightInstance(originAirport, flight1Number);
  const flight2 = await resolveFlightInstance(connectionAirport, flight2Number);
  
  if (!flight1 || !flight2) {
    throw new Error("Could not resolve flight schedule.");
  }

  const { data, error } = await supabase
    .from("trips")
    .insert({
      flight_1_number: flight1Number,
      flight_2_number: flight2Number,

      flight_id_f1: flight1.flightId,
      flight_id_f2: flight2.flightId,

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

  redirect(`/trip/${data.id}`);
}