const MAJOR_HUBS = [
    "ATL",
    "DFW",
    "ORD",
    "DEN",
    "CLT",
    "IAH",
    "PHX",
    "LAS"
  ]
  
  type RecoveryOption = {
    flightNumber: string
    airline: string
    departure: string
    arrival: string
    origin: string
    destination: string
    duration: string
  }
  
  const AIRLABS_BASE_URL = "https://airlabs.co/api/v9"
  
  async function getSchedules(dep: string, arr: string, apiKey: string) {
    const url =
      `${AIRLABS_BASE_URL}/schedules` +
      `?dep_iata=${dep}` +
      `&arr_iata=${arr}` +
      `&api_key=${apiKey}`
  
    const res = await fetch(url)
    const data = await res.json()
  
    return data?.response ?? []
  }
  
  function calculateDuration(dep: string, arr: string) {
    const diff = new Date(arr).getTime() - new Date(dep).getTime()
  
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
  
    return `${hours}h ${remainingMinutes}m`
  }
  
  export async function generateRecoveryPlan(
    connectionAirport: string,
    destinationAirport: string,
    arrivalTime: string | null,
    originalFlight: string
  ): Promise<RecoveryOption[]> {

    const originalAirline = originalFlight?.slice(0, 2);
  
    const apiKey = process.env.AIRLABS_API_KEY
    if (!apiKey) return []
  
    const arrival = arrivalTime ? new Date(arrivalTime) : null
  
    const MCT_MINUTES = 60
  
    const earliestDeparture =
      arrival
        ? new Date(arrival.getTime() + MCT_MINUTES * 60 * 1000)
        : null

    const now = new Date();
  
    const directSchedules = await getSchedules(
      connectionAirport,
      destinationAirport,
      apiKey
    )
  
    let flights: RecoveryOption[] = directSchedules
      .map((flight: any) => {
  
        const dep = flight.dep_time
        const arr = flight.arr_time
  
        if (!dep || !arr) return null
  
        return {
          airline: flight.airline_iata ?? "Airline",
          flightNumber: flight.flight_iata,
          departure: dep,
          arrival: arr,
          origin: flight.dep_iata ?? connectionAirport,
          destination: flight.arr_iata ?? destinationAirport,
          duration: calculateDuration(dep, arr)
        }
  
      })

      .filter((flight: RecoveryOption | null): flight is RecoveryOption => flight !== null)

      .filter((flight: RecoveryOption) => {
        if (!flight.departure || !flight.arrival) return false;
      
        const departureTime = new Date(flight.departure);
      
        // ❌ remove past flights
        if (departureTime < now) return false;
      
        const arrivalTimeAtConnection = arrival;

        if (arrivalTimeAtConnection) {
          const bufferMinutes =
            (departureTime.getTime() - arrivalTimeAtConnection.getTime()) / 60000;
        
          if (bufferMinutes < 60) return false;
        }

        // ❌ enforce connection buffer
        if (earliestDeparture && departureTime < earliestDeparture) return false;
      
        return true;
      })
  
    // SEARCH 1-STOP OPTIONS IF NOT ENOUGH DIRECT FLIGHTS
    if (flights.length < 3) {
  
      for (const hub of MAJOR_HUBS) {
  
        if (hub === connectionAirport || hub === destinationAirport) {
          continue
        }
  
        const firstLegs = await getSchedules(connectionAirport, hub, apiKey)
        const secondLegs = await getSchedules(hub, destinationAirport, apiKey)
  
        for (const f1 of firstLegs.slice(0, 2)) {
          for (const f2 of secondLegs.slice(0, 2)) {
  
            if (!f1.dep_time || !f1.arr_time || !f2.dep_time || !f2.arr_time) {
              continue
            }
  
            const arrivalHub = new Date(f1.arr_time)
            const departHub = new Date(f2.dep_time)
  
            const layoverMinutes =
              (departHub.getTime() - arrivalHub.getTime()) / 60000
  
            if (layoverMinutes < 60) continue
  
            const firstDeparture = new Date(f1.dep_time);

            // must also respect original arrival buffer
            if (earliestDeparture && firstDeparture < earliestDeparture) continue;
            
            // must not be in past
            if (firstDeparture < now) continue;

            flights.push({
              airline: f1.airline_iata ?? "Airline",
              flightNumber: `${f1.flight_iata} → ${f2.flight_iata}`,
              departure: f1.dep_time,
              arrival: f2.arr_time,
              origin: connectionAirport,
              destination: destinationAirport,
              duration: calculateDuration(f1.dep_time, f2.arr_time)
            })
          }
        }
      }
    }
  
    const uniqueFlights = new Map();

    for (const flight of flights) {
        const key = `${flight.departure}-${flight.arrival}-${flight.origin}-${flight.destination}`;
    
      if (!uniqueFlights.has(key)) {
        uniqueFlights.set(key, flight);
      }
    }
    
    flights = Array.from(uniqueFlights.values());
    
    const ranked = flights
    .sort((a, b) => {
      const aSameAirline = a.flightNumber?.startsWith(originalAirline);
      const bSameAirline = b.flightNumber?.startsWith(originalAirline);
  
      if (aSameAirline && !bSameAirline) return -1;
      if (!aSameAirline && bSameAirline) return 1;
  
      return new Date(a.arrival).getTime() - new Date(b.arrival).getTime();
    })
    .slice(0, 3);
    
    if (ranked.length > 0) {
      return ranked
    }

    // fallback: show next available departure

const schedules = await getSchedules(
    connectionAirport,
    destinationAirport,
    apiKey
  )
  
  if (!schedules || schedules.length === 0) {
    return []
  }
  
  const next = schedules
    .map((f: any) => ({
      airline: f.airline_iata ?? "Airline",
      flightNumber: f.flight_iata,
      departure: f.dep_time,
      arrival: f.arr_time,
      origin: connectionAirport,
      destination: destinationAirport,
      duration: calculateDuration(f.dep_time, f.arr_time)
    }))
    .filter((f: any) => f.departure && f.arrival)
    .sort(
      (a: any, b: any) =>
        new Date(a.departure).getTime() -
        new Date(b.departure).getTime()
    )[0]
  
  if (!next) {
    return []
  }
  
  return [next]}