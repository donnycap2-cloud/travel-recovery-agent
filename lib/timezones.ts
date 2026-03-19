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
    if (!tz) return new Date(time).getTime();
  
    try {
      // Step 1: parse while IGNORING provided timezone
      const dt = DateTime.fromISO(time, { setZone: true });
  
      // Step 2: force reinterpret as airport local time
      const local = DateTime.fromObject(
        {
          year: dt.year,
          month: dt.month,
          day: dt.day,
          hour: dt.hour,
          minute: dt.minute,
          second: dt.second
        },
        { zone: tz }
      );
  
      if (!local.isValid) return null;
  
      return local.toUTC().toMillis();
    } catch {
      return null;
    }
  }