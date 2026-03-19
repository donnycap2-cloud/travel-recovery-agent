const MAJOR_HUBS = [
  "ATL", "DFW", "ORD", "DEN", "CLT", "IAH", "PHX", "LAS"
];

type RecoveryOption = {
  flightNumber: string;
  airline: string;
  departure: string; // ISO
  arrival: string;   // ISO
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

  // ✅ SIMPLE TIME HANDLING (NO TIMEZONE LOGIC)
  const arrivalMs = arrivalTime ? new Date(arrivalTime).getTime() : null;

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

      const depMs = new Date(flight.dep_time).getTime();
      const arrMs = new Date(flight.arr_time).getTime();

      if (Number.isNaN(depMs) || Number.isNaN(arrMs)) return null;

      // ❌ remove past flights
      if (depMs < now) return null;

      // ❌ enforce MCT buffer
      if (earliestDeparture && depMs < earliestDeparture) return null;

      return {
        airline: flight.airline_iata ?? "Airline",
        flightNumber: flight.flight_iata,
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

          const f1DepMs = new Date(f1.dep_time).getTime();
          const f1ArrMs = new Date(f1.arr_time).getTime();
          const f2DepMs = new Date(f2.dep_time).getTime();
          const f2ArrMs = new Date(f2.arr_time).getTime();

          if (
            Number.isNaN(f1DepMs) ||
            Number.isNaN(f1ArrMs) ||
            Number.isNaN(f2DepMs) ||
            Number.isNaN(f2ArrMs)
          ) continue;

          // ❌ remove past
          if (f1DepMs < now) continue;

          // ❌ enforce MCT buffer
          if (earliestDeparture && f1DepMs < earliestDeparture) continue;

          const layoverMinutes = (f2DepMs - f1ArrMs) / 60000;
          if (layoverMinutes < 60) continue;

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

  return ranked.length > 0 ? ranked : [];
}