type RecoveryOption = {
    flightNumber: string
    departure: string
    arrival: string
    origin: string
    destination: string
  }
  
  const AIRLABS_BASE_URL = "https://airlabs.co/api/v9"
  
  export async function generateRecoveryPlan(
    connectionAirport: string,
    destinationAirport: string,
    arrivalTime: string | null
  ): Promise<RecoveryOption[]> {
  
    const apiKey = process.env.AIRLABS_API_KEY
  
    const url =
      `${AIRLABS_BASE_URL}/schedules` +
      `?dep_iata=${connectionAirport}` +
      `&arr_iata=${destinationAirport}` +
      `&api_key=${apiKey}`
  
    const res = await fetch(url)
  
    const data = await res.json()
  
    if (!data?.response) {
      return []
    }
  
    const arrival = arrivalTime ? new Date(arrivalTime) : null
  
    const MCT_MINUTES = 60
  
    const earliestPossibleDeparture =
      arrival
        ? new Date(arrival.getTime() + MCT_MINUTES * 60 * 1000)
        : null
  
    const flights: RecoveryOption[] = data.response
      .map((flight: any) => ({
        flightNumber: flight.flight_iata,
        departure: flight.dep_time,
        arrival: flight.arr_time,
        origin: flight.dep_iata,
        destination: flight.arr_iata
      }))
      .filter((flight: RecoveryOption) => {
  
        if (!flight.departure) return false
  
        const departureTime = new Date(flight.departure)
  
        if (!earliestPossibleDeparture) return true
  
        return departureTime > earliestPossibleDeparture
  
      })
      .sort(
        (a: RecoveryOption, b: RecoveryOption) =>
          new Date(a.arrival).getTime() -
          new Date(b.arrival).getTime()
      )
      .slice(0, 3)
  
    return flights
  }