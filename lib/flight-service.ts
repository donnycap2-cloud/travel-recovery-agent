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
  } catch {
    return null;
  }
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

    let flight = response[0];
  
    if (date) {
  
      const target = new Date(date).getTime();
  
      flight = response.reduce((closest, current) => {
  
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
    f => f.flightNumber?.toUpperCase() === flightNumber.toUpperCase()
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

  const flight = response[0];

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
  try {
    const apiKey = process.env.AIRLABS_API_KEY;

    const url = `https://airlabs.co/api/v9/schedules?dep_iata=${airportCode}&api_key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data?.response) {
      console.error("AirLabs returned no response field", data);
      return null;
    }

    return data.response.map((flight: any) => ({
      airline: flight.airline_iata,
      flightNumber: flight.flight_number,
      departureTime: flight.dep_time,
      arrivalTime: flight.arr_time,
      destination: flight.arr_iata
    }));
  } catch (error) {
    console.error("Airport departures fetch failed:", error);
    return null;
  }
}


