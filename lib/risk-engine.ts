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
  // Inputs are seconds; convert to minutes.
  const diffSeconds = scheduledDepartureF2 - estimatedArrivalF1;
  const connectionTimeRemaining = Math.round(diffSeconds / 60);

  if (connectionTimeRemaining > mctMinutes + 20) {
    return { state: "safe", connectionTimeRemaining };
  } else if (connectionTimeRemaining > mctMinutes - 20) {
    return { state: "tight", connectionTimeRemaining };
  } else if (connectionTimeRemaining >= mctMinutes - 30) {
    return { state: "likely_missed", connectionTimeRemaining };
  } else {
    return { state: "impossible", connectionTimeRemaining };
  }
}

