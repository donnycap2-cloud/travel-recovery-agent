import { parseLocalTime } from "@/lib/time";

const MAJOR_HUBS = [
  "ATL", "DFW", "ORD", "DEN", "CLT", "IAH", "PHX", "LAS"
];

type RecoveryOption = {
  flightNumber: string;
  airline: string;
  departure: string;
  arrival: string;
  origin: string;
  destination: string;
  duration: string;
};

const AIRLABS_BASE_URL = "https://airlabs.co/api/v9";


async function getSchedules(dep: string, arr: string, apiKey: string) {
  const url =
    `${AIRLABS_BASE_URL}/schedules` +
    `?dep_iata=${dep}` +
    `&arr_iata=${arr}` +
    `&api_key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  return data?.response ?? [];
}

function calculateDuration(dep: string, arr: string) {
  const depMs = parseLocalTime(dep);
  const arrMs = parseLocalTime(arr);

  if (!depMs || !arrMs) return "—";

  const diff = arrMs - depMs;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

export async function generateRecoveryPlan(
  connectionAirport: string,
  destinationAirport: string,
  arrivalTime: string | null,
  originalFlight: string
): Promise<RecoveryOption[]> {

  const originalAirline = originalFlight?.slice(0, 2);
  const apiKey = process.env.AIRLABS_API_KEY;
  if (!apiKey) return [];

  const now = Date.now();
  const arrivalMs = parseLocalTime(arrivalTime);

  const MIN_BUFFER = 30 * 60 * 1000; // 30 minutes

  // ========================
  // DIRECT FLIGHTS
  // ========================

  const directSchedules = await getSchedules(
    connectionAirport,
    destinationAirport,
    apiKey
  );

  let flights: RecoveryOption[] = directSchedules
    .map((flight: any) => {

      const depMs = parseLocalTime(flight.dep_time);
      const arrMs = parseLocalTime(flight.arr_time);

      if (!depMs || !arrMs) return null;

      // ❌ remove very old flights
      if (depMs < now - 60 * 60 * 1000) return null;

      // ✅ MUST be catchable after arrival
      if (arrivalMs && depMs < arrivalMs + MIN_BUFFER) return null;

      // Prefer operating flight if available
      const operatingFlight =
        flight.operating_flight_iata ??
        flight.flight_iata;

      const operatingAirline =
        flight.operating_airline_iata ??
        flight.airline_iata;

      return {
        airline: operatingAirline ?? "Airline",
        flightNumber: operatingFlight,
        departure: flight.dep_time,
        arrival: flight.arr_time,
        origin: flight.dep_iata ?? connectionAirport,
        destination: flight.arr_iata ?? destinationAirport,
        duration: calculateDuration(flight.dep_time, flight.arr_time)
      };
    })
    .filter((f: RecoveryOption | null): f is RecoveryOption => f !== null);

  // ========================
  // 1-STOP OPTIONS
  // ========================

  if (flights.length < 3) {

    for (const hub of MAJOR_HUBS) {

      if (hub === connectionAirport || hub === destinationAirport) continue;

      const firstLegs = await getSchedules(connectionAirport, hub, apiKey);
      const secondLegs = await getSchedules(hub, destinationAirport, apiKey);

      for (const f1 of firstLegs.slice(0, 2)) {
        for (const f2 of secondLegs.slice(0, 2)) {

          const f1DepMs = parseLocalTime(f1.dep_time);
          const f1ArrMs = parseLocalTime(f1.arr_time);
          const f2DepMs = parseLocalTime(f2.dep_time);
          const f2ArrMs = parseLocalTime(f2.arr_time);

          if (!f1DepMs || !f1ArrMs || !f2DepMs || !f2ArrMs) continue;

          // ❌ remove very old
          if (f1DepMs < now - 60 * 60 * 1000) continue;

          // ✅ must be catchable
          if (arrivalMs && f1DepMs < arrivalMs + MIN_BUFFER) continue;

          const layoverMinutes = (f2DepMs - f1ArrMs) / 60000;

          if (layoverMinutes < 30) continue;

          flights.push({
            airline: f1.airline_iata ?? "Airline",
            flightNumber: `${f1.flight_iata} → ${f2.flight_iata}`,
            departure: f1.dep_time,
            arrival: f2.arr_time,
            origin: connectionAirport,
            destination: destinationAirport,
            duration: calculateDuration(f1.dep_time, f2.arr_time)
          });
        }
      }
    }
  }

  // ========================
  // DEDUPE
  // ========================

  const uniqueFlights = new Map<string, RecoveryOption>();

  for (const f of flights) {
    const depMs = parseLocalTime(f.departure);
    const arrMs = parseLocalTime(f.arrival);
  
    if (!depMs || !arrMs) continue;
  
    // 🔑 Key = actual flight instance (not flight number)
    const key = `${f.origin}-${f.destination}-${depMs}-${arrMs}`;
  
    // Keep only ONE (prefer same airline if possible)
    if (!uniqueFlights.has(key)) {
      uniqueFlights.set(key, f);
    } else {
      const existing = uniqueFlights.get(key)!;
  
      const existingSame = existing.flightNumber?.startsWith(originalAirline);
      const currentSame = f.flightNumber?.startsWith(originalAirline);
  
      // ✅ Prefer same airline version
      if (currentSame && !existingSame) {
        uniqueFlights.set(key, f);
      }
    }
  }
  
  flights = Array.from(uniqueFlights.values());

  // ========================
  // RANKING
  // ========================

  const ranked = flights
    .sort((a, b) => {

      const aDep = parseLocalTime(a.departure);
      const bDep = parseLocalTime(b.departure);

      const aArr = parseLocalTime(a.arrival);
      const bArr = parseLocalTime(b.arrival);

      if (!aDep || !bDep || !aArr || !bArr) return 0;

      const aSame = a.flightNumber?.startsWith(originalAirline);
      const bSame = b.flightNumber?.startsWith(originalAirline);

      // 1. Soonest departure
      if (Math.abs(aDep - now) !== Math.abs(bDep - now)) {
        return Math.abs(aDep - now) - Math.abs(bDep - now);
      }

      // 2. Earliest arrival
      if (aArr !== bArr) {
        return aArr - bArr;
      }

      // 3. Same airline
      if (aSame && !bSame) return -1;
      if (!aSame && bSame) return 1;

      return 0;
    })
    .slice(0, 3);

  // ========================
  // GUARANTEE OUTPUT
  // ========================

  if (ranked.length === 0) {
    return [
      {
        flightNumber: "Standby Option",
        airline: "Check Airline Desk",
        departure: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
        arrival: new Date(now + 5 * 60 * 60 * 1000).toISOString(),
        origin: connectionAirport,
        destination: destinationAirport,
        duration: "3h"
      }
    ];
  }

  return ranked;
}