const AIRLABS_BASE_URL = "https://airlabs.co/api/v9";

function getApiKey() {
  const key = process.env.AIRLABS_API_KEY;
  return key && key.length > 0 ? key : null;
}

async function safeFetch<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  const search = new URLSearchParams({ api_key: apiKey, ...params });
  const url = `${AIRLABS_BASE_URL}${path}?${search.toString()}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return null;
    }

    const json = (await res.json()) as { response?: unknown };
    return (json.response as T | undefined) ?? null;
  } catch (error) {
    console.error("API fetch failed:", path, params, error);
    return null;
  }
}

function normalizeFlightNumber(f: string | null | undefined) {
  return f?.replace(/\s+/g, "").toUpperCase() ?? "";
}

export type ResolvedFlightInstance = {
  flightId: string;
  origin: string;
  destination: string;
  scheduledDeparture: string | null;
  scheduledArrival: string | null;
};

export async function resolveFlightInstance(
  originAirport: string,
  flightNumber: string,
  date?: string
): Promise<ResolvedFlightInstance | null> {

  // --- Attempt 1: direct flight lookup
  const response = await safeFetch<
    Array<{
      flight_iata?: string
      dep_iata?: string
      arr_iata?: string
      dep_time?: string
      arr_time?: string
    }>
  >("/schedules", {
    flight_iata: flightNumber,
    ...(date ? { date } : {})
  });

  if (response && response.length > 0) {

  // STEP 1: filter by correct origin
  let candidates = response.filter(
    (f) => f.dep_iata === originAirport && f.flight_iata === flightNumber
  );

  // fallback if nothing matches (optional but safe)
  if (candidates.length === 0) {
    candidates = response;
  }

  // STEP 2: pick best by date (if provided)
  let flight = candidates[0];

  if (date) {
    const target = new Date(date).getTime();

    flight = candidates.reduce((closest, current) => {
      const closestTime = new Date(closest.dep_time ?? "").getTime();
      const currentTime = new Date(current.dep_time ?? "").getTime();

      if (!closest.dep_time) return current;
      if (!current.dep_time) return closest;

      const closestDiff = Math.abs(closestTime - target);
      const currentDiff = Math.abs(currentTime - target);

      return currentDiff < closestDiff ? current : closest;
    });
  }

    return {
      flightId: flight.flight_iata ?? flightNumber,
      origin: flight.dep_iata ?? originAirport,
      destination: flight.arr_iata ?? "",
      scheduledDeparture: flight.dep_time ?? null,
      scheduledArrival: flight.arr_time ?? null
    };
  }

  console.log("Direct lookup failed, trying airport departures");

  // --- Attempt 2: search airport departures
  if (!originAirport) {
    return null;
  }

  const departures = await getAirportDepartures(originAirport);

  if (!departures) {
    return null;
  }

  const match = departures.find(
    f => normalizeFlightNumber(f.flightNumber) === normalizeFlightNumber(flightNumber)
  );

  if (!match) {
    return null;
  }

  return {
    flightId: flightNumber,
    origin: originAirport,
    destination: match.destination ?? "",
    scheduledDeparture: match.departureTime ?? null,
    scheduledArrival: match.arrivalTime ?? null
  };
}

export type FlightStatus = {
  flightNumber: string;

  scheduledDeparture?: string | null;
  scheduledArrival?: string | null;

  estimatedDeparture?: string | null;
  estimatedArrival?: string | null;

  actualDeparture?: string | null;
  actualArrival?: string | null;
};

export async function getFlightStatus(flightIata: string): Promise<FlightStatus | null> {
  const response = await safeFetch<
  Array<{
    flight_number?: string;

    dep_time?: string;
    arr_time?: string;

    dep_estimated?: string;
    arr_estimated?: string;

    dep_actual?: string;
    arr_actual?: string;

    status?: string;
  }>
>("/flights", {
  flight_iata: flightIata
});

  if (!response || response.length === 0) {
    return null;
  }

  const now = Date.now();

  const flight = response.reduce((closest, current) => {
    const currentTime = new Date(current.dep_time ?? "").getTime();
    const closestTime = new Date(closest.dep_time ?? "").getTime();
  
    if (!current.dep_time) return closest;
    if (!closest.dep_time) return current;
  
    return Math.abs(currentTime - now) < Math.abs(closestTime - now)
      ? current
      : closest;
  });

  return {
    flightNumber: flight.flight_number ?? flightIata,
  
    scheduledDeparture: flight.dep_time ?? null,
    scheduledArrival: flight.arr_time ?? null,
  
    estimatedDeparture: flight.dep_estimated ?? null,
    estimatedArrival: flight.arr_estimated ?? null,
  
    actualDeparture: flight.dep_actual ?? null,
    actualArrival: flight.arr_actual ?? null
  };
}

export type AirportDeparture = {
  airline: string | null;
  flightNumber: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  destination: string | null;
};

export async function getAirportDepartures(
  airportCode: string
): Promise<AirportDeparture[] | null> {

  const response = await safeFetch<any[]>(
    "/schedules",
    { dep_iata: airportCode }
  );

  if (!response) return null;

  return response.map((flight: any) => ({
    airline: flight.airline_iata ?? null,
    flightNumber: flight.flight_iata ?? null,
    departureTime: flight.dep_time ?? null,
    arrivalTime: flight.arr_time ?? null,
    destination: flight.arr_iata ?? null
  }));
}


