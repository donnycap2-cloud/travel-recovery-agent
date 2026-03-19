import { DateTime } from "luxon";

// Expand this over time
const AIRPORT_TIMEZONES: Record<string, string> = {
  // US
  LAX: "America/Los_Angeles",
  SFO: "America/Los_Angeles",
  SEA: "America/Los_Angeles",
  LAS: "America/Los_Angeles",
  SAN: "America/Los_Angeles",

  DEN: "America/Denver",
  SLC: "America/Denver",
  PHX: "America/Phoenix",

  ORD: "America/Chicago",
  DFW: "America/Chicago",

  MIA: "America/New_York",
  JFK: "America/New_York",
  ATL: "America/New_York",
  BOS: "America/New_York",

  // Caribbean (you)
  STX: "America/St_Thomas",
  STT: "America/St_Thomas",
  SJU: "America/Puerto_Rico",

  // Europe (starter)
  LHR: "Europe/London",
  CDG: "Europe/Paris",
};

export function parseAirportTime(
    time: string | null,
    airport: string
  ): number | null {
    if (!time) return null;
  
    const tz = AIRPORT_TIMEZONES[airport];
  
    if (!tz) {
      return new Date(time).getTime(); // fallback
    }
  
    // 🔥 Force correct timezone interpretation
    const date = new Date(
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }).format(new Date(time))
    );
  
    return date.getTime();
  }