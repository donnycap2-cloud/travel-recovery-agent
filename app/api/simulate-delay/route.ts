import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { runMonitoringCycle } from "@/lib/monitoring-worker";

export async function POST(req: NextRequest) {

  const body = await req.json();

  const tripId = body.tripId;
  const delayMinutes = body.delayMinutes;

  console.log("SIMULATE DELAY REQUEST:", body);

  const { data: trip, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();

  if (!trip) {
    console.log("Trip not found");
    return NextResponse.json({ ok: false });
  }

  const arrival = new Date(trip.scheduled_arrival_f1);

  arrival.setMinutes(arrival.getMinutes() + delayMinutes);

  console.log("NEW ESTIMATED ARRIVAL:", arrival.toISOString());

  const { error: updateError } = await supabase
    .from("trips")
    .update({
      estimated_arrival_f1: arrival.toISOString()
    })
    .eq("id", tripId);

  if (updateError) {
    console.log("UPDATE ERROR:", updateError);
  }

  await runMonitoringCycle();

  return NextResponse.json({ ok: true });
}