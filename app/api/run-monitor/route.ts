import { runMonitoringCycle } from "@/lib/monitoring-worker";

export async function GET() {
  try {
    const result = await runMonitoringCycle();

    return Response.json({
      ok: true,
      summary: result
    });

  } catch (error) {
    console.error("MONITOR ERROR:", error);

    return Response.json({
      ok: false,
      error: "monitor failed"
    });
  }
}
