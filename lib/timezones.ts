import { DateTime } from "luxon";

// Expand this over time
const AIRPORT_TIMEZONES: Record<string, string> = {
  // US
  LAX: "America/Los_Angeles",
  SFO: "America/Los_Angeles",
  SEA: "America/Los_Angeles",

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
  STT: "America/St_Thomas",
  SJU: "America/Puerto_Rico",

  // Europe (starter)
  LHR: "Europe/London",
  CDG: "Europe/Paris",
};

export function toUTCFromAirport(
  localTime: string | null,
  airport: string
): string | null {
  if (!localTime) return null;

  const zone = AIRPORT_TIMEZONES[airport] ?? "UTC";

  let dt = DateTime.fromISO(localTime, { zone });

  // 🔥 fallback for "YYYY-MM-DD HH:mm"
  if (!dt.isValid) {
    dt = DateTime.fromFormat(localTime, "yyyy-MM-dd HH:mm", { zone });
  }

  if (!dt.isValid) {
    console.log("❌ INVALID TIME:", localTime, airport);
    return null;
  }

  return dt.toUTC().toISO();
}
