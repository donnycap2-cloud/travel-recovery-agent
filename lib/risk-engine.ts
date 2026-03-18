export type MonitoringState =
  | "safe"
  | "tight"
  | "likely_missed"
  | "impossible";

  export function calculateConnectionRisk(
    estimatedArrivalF1: number,
    scheduledDepartureF2: number,
    mctMinutes: number
  ): {
    state: MonitoringState;
    connectionTimeRemaining: number;
  } {
    const diffSeconds = scheduledDepartureF2 - estimatedArrivalF1;
    const connectionTimeRemaining = Math.round(diffSeconds / 60);
  
    // 🔴 Already missed
    if (connectionTimeRemaining < 0) {
      return { state: "impossible", connectionTimeRemaining };
    }
  
    // 🟠 Below minimum connection time
    if (connectionTimeRemaining < mctMinutes) {
      return { state: "likely_missed", connectionTimeRemaining };
    }
  
    // 🟡 Barely makes MCT (risky buffer)
    if (connectionTimeRemaining < mctMinutes + 20) {
      return { state: "tight", connectionTimeRemaining };
    }
  
    // 🟢 Comfortable buffer
    return { state: "safe", connectionTimeRemaining };
  }

