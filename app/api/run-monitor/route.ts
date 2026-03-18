import { runMonitoringCycle } from "@/lib/monitoring-worker";

export async function GET() {
  console.log("API ROUTE HIT");

  return Response.json({
    ok: true,
    test: "ROUTE WORKING"
  });
}
