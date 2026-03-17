import { NextResponse } from "next/server";
import { runMonitoringCycle } from "@/lib/monitoring-worker";

export async function GET() {
  console.log("🔥 NEW VERSION");

  return Response.json({
    ok: true,
    version: "NEW CODE RUNNING"
  });
}
