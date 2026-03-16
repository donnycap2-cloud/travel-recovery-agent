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
        .map((flight: any) => {
      
          const dep = flight.dep_time
          const arr = flight.arr_time
      
          if (!dep || !arr) return null
      
          return {
            airline: flight.airline_iata ?? "Airline",
            flightNumber: flight.flight_iata,
            departure: dep,
            arrival: arr,
            origin: flight.dep_iata,
            destination: flight.arr_iata,
            duration: calculateDuration(dep, arr)
          }
      
        })
        .filter((flight: RecoveryOption | null): flight is RecoveryOption => flight !== null)
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