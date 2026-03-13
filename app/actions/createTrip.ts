"use server";

import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function createTripAndRedirect(args: {
  flight_number_f1: string;
  flight_number_f2: string;
  connectionAirport: string;
  destinationAirport: string;
}) {
  const { flight_number_f1, flight_number_f2, connectionAirport, destinationAirport } = args;

  const { data, error } = await supabase
    .from("trips")
    .insert({
      flight_number_f1: flight_number_f1,
      flight_number_f2: flight_number_f2,
      connection_airport: connectionAirport,
      destination_airport: destinationAirport,
      monitoring_state: "safe"
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message || "Failed to create trip.");
  }

  redirect(`/trip/${data.id}`);
}

