export function getMCT(
  airport: string,
  destinationAirport?: string
): number {

  const MCT_MAP: Record<string, number> = {
    ATL: 50, DFW: 50, ORD: 50, DEN: 50, CLT: 50, IAH: 50, PHX: 50, LAS: 50,
    LAX: 60, JFK: 60, EWR: 60, MIA: 60, SFO: 60, SEA: 60,
    BOS: 50, DCA: 45, IAD: 50, PHL: 50, MSP: 50, DTW: 50, BWI: 50,
    AUS: 40, SJC: 40, RDU: 40, MCI: 40, SMF: 40,
    STX: 35, STT: 35, SJU: 45, NAS: 45
  };

  const base = MCT_MAP[airport] ?? 50;

  // 🌍 VERY SIMPLE international detection
  const INTERNATIONAL_AIRPORTS = ["LHR", "CDG", "FRA", "AMS"];

  const isInternational =
    destinationAirport && INTERNATIONAL_AIRPORTS.includes(destinationAirport);

  if (isInternational) {
    return base + 30;
  }

  return base;
}
