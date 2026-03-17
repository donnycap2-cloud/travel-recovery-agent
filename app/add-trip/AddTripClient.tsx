"use client";

import { MobileHeader } from "@/components/MobileHeader";
import { Card } from "@/ui/Card";
import { useFormState, useFormStatus } from "react-dom";
import { fetchFlightData, type FetchFlightDataState } from "./actions";
import { createTripAndRedirect } from "@/app/actions/createTrip";

const initialState: FetchFlightDataState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200 disabled:opacity-60"
    >
      {pending ? "Checking flights…" : "Submit"}
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-300">{message}</p>;
}

export function AddTripClient() {
  const [state, action] = useFormState(fetchFlightData, initialState);

  if (state.status === "success") {
    const { flight1, flight2, connectionMinutes } = state.data;
    const connectionAirport = flight1.destination;
    const destinationAirport = flight2.destination;

    return (
      <main>
        <MobileHeader title="Confirm trip" backHref="/add-trip" />

        <section className="space-y-3">
          <Card>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Flight 1</p>
            <p className="mt-1 text-sm font-semibold text-zinc-50">{flight1.flightNumber}</p>
            <p className="mt-2 text-sm text-zinc-200">
              <span className="font-medium text-zinc-100">{flight1.origin}</span> →{" "}
              <span className="font-medium text-zinc-100">{flight1.destination}</span>
            </p>
            <p className="mt-1 text-sm text-zinc-200">
              Arrival: <span className="font-medium text-zinc-100">{flight1.arrivalTime}</span>
            </p>
          </Card>

          <Card>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Flight 2</p>
            <p className="mt-1 text-sm font-semibold text-zinc-50">{flight2.flightNumber}</p>
            <p className="mt-2 text-sm text-zinc-200">
              <span className="font-medium text-zinc-100">{flight2.origin}</span> →{" "}
              <span className="font-medium text-zinc-100">{flight2.destination}</span>
            </p>
            <p className="mt-1 text-sm text-zinc-200">
              Departure:{" "}
              <span className="font-medium text-zinc-100">{flight2.departureTime}</span>
            </p>
          </Card>

          <Card className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-400">Connection time</p>
              <p className="mt-1 text-lg font-semibold text-zinc-50">{connectionMinutes} min</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-100 ring-1 ring-white/10">
              {connectionMinutes < 45 ? "Tight" : connectionMinutes < 90 ? "OK" : "Comfortable"}
            </span>
          </Card>

          <form action={createTripAndRedirect}>
            <input type="hidden" name="flight1Number" value={flight1.flightNumber} />
            <input type="hidden" name="flight2Number" value={flight2.flightNumber} />
            <input type="hidden" name="originAirport" value={flight1.origin} />
            <input type="hidden" name="connectionAirport" value={connectionAirport} />
            <input type="hidden" name="destinationAirport" value={destinationAirport} />

            <input type="hidden" name="scheduledDepartureF1" value={flight1.departureTime ?? ""} />
            <input type="hidden" name="scheduledArrivalF1" value={flight1.arrivalTime ?? ""} />

            <input type="hidden" name="scheduledDepartureF2" value={flight2.departureTime ?? ""} />
            <input type="hidden" name="scheduledArrivalF2" value={flight2.arrivalTime ?? ""} />

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-zinc-50 ring-1 ring-white/10 hover:bg-white/15 active:bg-white/20"
           >
              Confirm
            </button>
          </form>
        </section>
      </main>
    );
  }

  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};

  return (
    <main>
      <MobileHeader title="Add trip" backHref="/" />

      <form action={action} className="space-y-3">

        <Card className="space-y-3">

          <div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-300">
                Origin airport
              </span>
              <input
                name="originAirport"
                defaultValue={values.originAirport}
                placeholder="e.g. STX"
                className="w-full rounded-2xl bg-zinc-950/40 px-4 py-3 text-sm text-zinc-100 ring-1 ring-white/10 placeholder:text-zinc-500"
              />
            </label>
            <FieldError message={errors.originAirport} />
          </div>

          <div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-300">Flight 1 Number</span>
              <input
                name="flight1"
                inputMode="text"
                autoComplete="off"
                placeholder="e.g. AA123"
                defaultValue={values.flight1}
                className="w-full rounded-2xl bg-zinc-950/40 px-4 py-3 text-sm text-zinc-100 ring-1 ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-invalid={Boolean(errors.flight1)}
              />
            </label>
            <FieldError message={errors.flight1} />
          </div>

          <div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-300">Flight 2 Number</span>
              <input
                name="flight2"
                inputMode="text"
                autoComplete="off"
                placeholder="e.g. AA456"
                defaultValue={values.flight2}
                className="w-full rounded-2xl bg-zinc-950/40 px-4 py-3 text-sm text-zinc-100 ring-1 ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-invalid={Boolean(errors.flight2)}
              />
            </label>
            <FieldError message={errors.flight2} />
          </div>

          <div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-300">Date</span>
              <input
                name="date"
                type="date"
                defaultValue={values.date}
                className="w-full rounded-2xl bg-zinc-950/40 px-4 py-3 text-sm text-zinc-100 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-invalid={Boolean(errors.date)}
              />
            </label>
            <FieldError message={errors.date} />
          </div>
        </Card>

        {state.status === "error" && state.message ? (
          <p className="text-sm text-red-300">{state.message}</p>
        ) : null}

        <SubmitButton />
      </form>
    </main>
  );
}

