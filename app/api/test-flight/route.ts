import { NextResponse } from "next/server";
import { getAirportDepartures } from "@/lib/flight-service";

export async function GET() {
  console.log("Test route started");

  const flights = await getAirportDepartures("ATL");

  console.log("Flights returned:", flights);

  return NextResponse.json({
    ok: true,
    flights
  });
}
