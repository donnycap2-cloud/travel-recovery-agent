import { NextResponse } from "next/server";
import { runMonitoringCycle } from "@/lib/monitoring-worker";

export async function GET() {
  return new Response("RUN MONITOR V2");
}