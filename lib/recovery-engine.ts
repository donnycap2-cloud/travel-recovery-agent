export type RecoveryOption = {
    flightNumber: string
    departure: string
    arrival: string
  }
  
  export function generateRecoveryPlan(destination: string): RecoveryOption[] {
  
    // Stubbed recovery options
    // Later this will call flight search APIs
  
    return [
      {
        flightNumber: "UA1823",
        departure: "6:30 PM",
        arrival: "9:10 PM"
      },
      {
        flightNumber: "AA901",
        departure: "7:15 PM",
        arrival: "9:45 PM"
      }
    ]
  }
  
