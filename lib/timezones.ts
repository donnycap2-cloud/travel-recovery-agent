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
      // 1. Parse ISO (ignore its timezone meaning)
      const parsed = DateTime.fromISO(time);
  
      if (!parsed.isValid) {
        console.log("INVALID DATE", time);
        return null;
      }
  
      // 2. Reinterpret same clock time in airport timezone
      const local = DateTime.fromObject(
        {
          year: parsed.year,
          month: parsed.month,
          day: parsed.day,
          hour: parsed.hour,
          minute: parsed.minute,
          second: parsed.second
        },
        { zone: tz }
      );
  
      if (!local.isValid) {
        console.log("INVALID LOCAL", time, airport);
        return null;
      }
  
      // 3. Convert to UTC timestamp
      return local.toUTC().toMillis();
  
    } catch (err) {
      console.log("PARSE ERROR", time, airport, err);
      return null;
    }
  }