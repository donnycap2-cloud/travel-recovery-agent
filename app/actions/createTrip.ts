"use server";

import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function createTripAndRedirect(formData: FormData) {

  const flight1Number = formData.get("flight1Number") as string;
  const flight2Number = formData.get("flight2Number") as string;

  const originAirport = formData.get("originAirport") as string;
  const connectionAirport = formData.get("connectionAirport") as string;
  const destinationAirport = formData.get("destinationAirport") as string;

  const scheduledDepartureF1 = formData.get("scheduledDepartureF1") as string | null;
  const scheduledArrivalF1 = formData.get("scheduledArrivalF1") as string | null;

  const scheduledDepartureF2 = formData.get("scheduledDepartureF2") as string | null;
  const scheduledArrivalF2 = formData.get("scheduledArrivalF2") as string | null;

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