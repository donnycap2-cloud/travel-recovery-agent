import { DateTime } from "luxon";

const AIRPORT_TIMEZONES: Record<string, string> = {
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

  STX: "America/St_Thomas",
  STT: "America/St_Thomas",
  SJU: "America/Puerto_Rico",

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
    return new Date(time).getTime();
  }

  try {
    // 🔥 strip ANY timezone info from API
    const cleaned = time.replace(/Z|[+-]\d{2}:\d{2}$/, "");

    const dt = DateTime.fromISO(cleaned, { zone: tz });

    if (!dt.isValid) return null;

    return dt.toUTC().toMillis();
  } catch {
    return null;
  }
}