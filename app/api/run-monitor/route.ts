import { NextResponse } from "next/server";
import { runMonitoringCycle } from "@/lib/monitoring-worker";

export async function GET() {
  try {
    const result = await runMonitoringCycle();

    return NextResponse.json({
      ok: true,
      summary: result
    });

  } catch (error) {
    console.error("MONITOR ERROR:", error);

    return NextResponse.json({
      ok: false,
      error: "monitor failed"
    }, { status: 500 });
  }
}
