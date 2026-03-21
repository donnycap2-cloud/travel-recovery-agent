import { runMonitoringCycle } from "@/lib/monitoring-worker";

export async function GET() {
  console.log("RUNNING MONITOR NOW");

  const result = await runMonitoringCycle();

  return Response.json({
    ok: true,
    result
  });
}

