import { NextResponse } from "next/server";
import { runMonitoringCycle } from "@/lib/monitoring-worker";


export async function GET() {
 return Response.json({
   ok: true,
   message: "monitor paused"
 });
}

