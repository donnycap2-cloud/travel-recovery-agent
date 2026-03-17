import { NextResponse } from "next/server";
import { runMonitoringCycle } from "@/lib/monitoring-worker";

export async function GET() {
  const result = await runMonitoringCycle();

  return NextResponse.json({
    ok: true,
    summary: result
  });
}
