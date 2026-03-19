import { parseAirportTime } from "@/lib/timezones";

const MAJOR_HUBS = [
  "ATL", "DFW", "ORD", "DEN", "CLT", "IAH", "PHX", "LAS"
];

type RecoveryOption = {
  flightNumber: string;
  airline: string;
  departure: string; // ISO UTC
  arrival: string;   // ISO UTC
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

function calculateDuration(depIso: string, arrIso: string) {
  const diff = new Date(arrIso).getTime() - new Date(depIso).getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function getMCT(airport: string): number {
  const MCT_MAP: Record<string, number> = {
    ATL: 60, DFW: 60, ORD: 60, DEN: 60, CLT: 60, IAH: 60, PHX: 60, LAS: 60,
    LAX: 75, JFK: 75, EWR: 75, MIA: 75, SFO: 75, SEA: 75,
    BOS: 60, DCA: 60, IAD: 60, PHL: 60, MSP: 60, DTW: 60, BWI: 60,
    AUS: 50, SJC: 50, RDU: 50, MCI: 50, SMF: 50,
    STX: 45, STT: 45, SJU: 50, NAS: 50, BGI: 50
  };

  return MCT_MAP[airport] ?? 60;
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

  // ✅ Normalize arrival
  const arrivalMs = arrivalTime
    ? parseAirportTime(arrivalTime, connectionAirport)
    : null;

  const MCT_MINUTES = getMCT(connectionAirport);

  const earliestDeparture = arrivalMs
    ? arrivalMs + MCT_MINUTES * 60 * 1000
    : null;

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

      const depMs = parseAirportTime(
        flight.dep_time,
        flight.dep_iata ?? connectionAirport
      );

      const arrMs = parseAirportTime(
        flight.arr_time,
        flight.arr_iata ?? destinationAirport
      );

      if (!depMs || !arrMs) return null;

      // ❌ remove past
      if (depMs < now) return null;

      // ❌ enforce MCT buffer
      if (earliestDeparture && depMs < earliestDeparture) return null;

      const depIso = new Date(depMs).toISOString();
      const arrIso = new Date(arrMs).toISOString();

      return {
        airline: flight.airline_iata ?? "Airline",
        flightNumber: flight.flight_iata,
        departure: depIso,
        arrival: arrIso,
        origin: flight.dep_iata ?? connectionAirport,
        destination: flight.arr_iata ?? destinationAirport,
        duration: calculateDuration(depIso, arrIso)
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

          const f1DepMs = parseAirportTime(f1.dep_time, f1.dep_iata ?? connectionAirport);
          const f1ArrMs = parseAirportTime(f1.arr_time, f1.arr_iata ?? hub);
          const f2DepMs = parseAirportTime(f2.dep_time, f2.dep_iata ?? hub);
          const f2ArrMs = parseAirportTime(f2.arr_time, f2.arr_iata ?? destinationAirport);

          if (!f1DepMs || !f1ArrMs || !f2DepMs || !f2ArrMs) continue;

          // ❌ remove past
          if (f1DepMs < now) continue;

          // ❌ enforce connection timing
          if (earliestDeparture && f1DepMs < earliestDeparture) continue;

          const layoverMinutes = (f2DepMs - f1ArrMs) / 60000;
          if (layoverMinutes < 60) continue;

          const depIso = new Date(f1DepMs).toISOString();
          const arrIso = new Date(f2ArrMs).toISOString();

          flights.push({
            airline: f1.airline_iata ?? "Airline",
            flightNumber: `${f1.flight_iata} → ${f2.flight_iata}`,
            departure: depIso,
            arrival: arrIso,
            origin: connectionAirport,
            destination: destinationAirport,
            duration: calculateDuration(depIso, arrIso)
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
    const key = `${f.departure}-${f.arrival}-${f.origin}-${f.destination}`;
    if (!uniqueFlights.has(key)) {
      uniqueFlights.set(key, f);
    }
  }

  flights = Array.from(uniqueFlights.values());

  // ========================
  // RANKING
  // ========================

  const ranked = flights
    .sort((a, b) => {

      const aDep = new Date(a.departure).getTime();
      const bDep = new Date(b.departure).getTime();

      const aArr = new Date(a.arrival).getTime();
      const bArr = new Date(b.arrival).getTime();

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

  if (ranked.length > 0) return ranked;

  return [];
}