"use server";

import { resolveFlightInstance } from "@/lib/flight-service";

type FlightLeg = {
  flightNumber: string
  origin: string
  destination: string
  departureTime: string | null
  arrivalTime: string | null
};

export type FetchFlightDataState =
  | {
      status: "idle" | "error";
      message?: string;
      fieldErrors?: Partial<Record<"flight1" | "flight2" | "date", string>>;
      values?: { flight1?: string; flight2?: string; date?: string };
    }
  | {
      status: "success";
      values: { flight1: string; flight2: string; date: string };
      data: {
        flight1: Required<
          Pick<FlightLeg, "flightNumber" | "origin" | "destination" | "arrivalTime" | "departureTime">
        >;
        flight2: Required<
          Pick<FlightLeg, "flightNumber" | "origin" | "destination" | "arrivalTime" | "departureTime">
        >;
        connectionMinutes: number;
      };
    };

function normalizeFlightNumber(input: string) {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

function isValidFlightNumber(flight: string) {
  // Simple, permissive pattern: 2-3 letter/numver airline code + 1-4 digits
  return /^[A-Z0-9]{2,3}\d{1,4}$/.test(flight);
}

function hashToIndex(str: string, modulo: number) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % modulo;
}

const AIRPORTS = ["JFK", "LGA", "EWR", "BOS", "PHL", "DCA", "IAD", "ATL", "MIA", "ORD", "DEN", "LAX", "SFO", "SEA"];

function pickAirport(seed: string, offset: number) {
  return AIRPORTS[hashToIndex(`${seed}:${offset}`, AIRPORTS.length)]!;
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function parseDateInput(date: string) {
  // HTML date input: YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const dt = new Date(year, month - 1, day);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export async function fetchFlightData(
  prevState: FetchFlightDataState,
  formData: FormData
): Promise<FetchFlightDataState> {
  const rawFlight1 = String(formData.get("flight1") ?? "");
  const rawFlight2 = String(formData.get("flight2") ?? "");
  const rawDate = String(formData.get("date") ?? "");

  const originAirport = String(formData.get("originAirport") ?? "").toUpperCase()
  const flight1 = normalizeFlightNumber(rawFlight1);
  const flight2 = normalizeFlightNumber(rawFlight2);
  const date = rawDate.trim();

  const fieldErrors: Partial<Record<"flight1" | "flight2" | "date" | "originAirport", string>> = {};
  if (!flight1) fieldErrors.flight1 = "Enter flight 1 number.";
  else if (!isValidFlightNumber(flight1)) fieldErrors.flight1 = "Use format like AA123.";

  if (!flight2) fieldErrors.flight2 = "Enter flight 2 number.";
  else if (!isValidFlightNumber(flight2)) fieldErrors.flight2 = "Use format like AA123.";

  if (!originAirport) {
    fieldErrors.originAirport = "Enter origin airport."
  }

  const baseDate = parseDateInput(date);
  if (!date) fieldErrors.date = "Select a date.";
  else if (!baseDate) fieldErrors.date = "Invalid date.";

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Fix the highlighted fields.",
      fieldErrors,
      values: { flight1: rawFlight1, flight2: rawFlight2, date: rawDate }
    };
  }

  const flight1Resolved = await resolveFlightInstance(
    originAirport,
    flight1,
    date
  );
  const flight2Resolved = await resolveFlightInstance(
    flight1Resolved?.destination ?? "",
    flight2,
    date
  );
  
  if (!flight1Resolved || !flight2Resolved) {
    return {
      status: "error",
      message: "Could not resolve flight schedule.",
      values: { flight1: rawFlight1, flight2: rawFlight2, date: rawDate }
    };
  }

  const arrival = new Date(flight1Resolved.scheduledArrival!);
const depart = new Date(flight2Resolved.scheduledDeparture!);

const connectionMinutes = Math.round(
  (depart.getTime() - arrival.getTime()) / 60000
);


  return {
    status: "success",
    values: {
      flight1,
      flight2,
      date
    },
    data: {
      flight1: {
        flightNumber: flight1Resolved.flightId,
        origin: flight1Resolved.origin,
        destination: flight1Resolved.destination,
        departureTime: flight1Resolved.scheduledDeparture!,
        arrivalTime: flight1Resolved.scheduledArrival!
      },
      flight2: {
        flightNumber: flight2Resolved.flightId,
        origin: flight2Resolved.origin,
        destination: flight2Resolved.destination,
        departureTime: flight2Resolved.scheduledDeparture!,
        arrivalTime: flight2Resolved.scheduledArrival!
      },
      connectionMinutes
    }
}

}
