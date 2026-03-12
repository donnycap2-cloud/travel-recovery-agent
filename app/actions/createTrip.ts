"use server";

import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function createTripAndRedirect(args: {
  flight1Number: string;
  flight2Number: string;
  connectionAirport: string;
  destinationAirport: string;
}) {
  const { flight1Number, flight2Number, connectionAirport, destinationAirport } = args;

  const { data, error } = await supabase
    .from("trips")
    .insert({
      flight_1_number: flight1Number,
      flight_2_number: flight2Number,
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

