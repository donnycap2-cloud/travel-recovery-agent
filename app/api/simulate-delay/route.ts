import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { runMonitoringCycle } from "@/lib/monitoring-worker";

export async function POST(req: NextRequest) {

  const { tripId, delayMinutes } = await req.json();

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();

  if (!trip) {
    return NextResponse.json({ ok: false });
  }

  const arrival = new Date(trip.scheduled_arrival_f1);

  arrival.setMinutes(arrival.getMinutes() + delayMinutes);

  await supabase
    .from("trips")
    .update({
      estimated_arrival_f1: arrival.toISOString()
    })
    .eq("id", tripId);

  await runMonitoringCycle();

  return NextResponse.json({ ok: true });
}