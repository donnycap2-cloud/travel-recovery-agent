export function getMCT(airport: string): number {
    const MCT_MAP: Record<string, number> = {
      ATL: 60, DFW: 60, ORD: 60, DEN: 60, CLT: 60, IAH: 60, PHX: 60, LAS: 60,
      LAX: 75, JFK: 75, EWR: 75, MIA: 75, SFO: 75, SEA: 75,
      BOS: 60, DCA: 60, IAD: 60, PHL: 60, MSP: 60, DTW: 60, BWI: 60,
      AUS: 50, SJC: 50, RDU: 50, MCI: 50, SMF: 50,
      STX: 45, STT: 45, SJU: 50, NAS: 50
    };
  
    return MCT_MAP[airport] ?? 60;
  }
