export const dynamic = "force-dynamic";

import { MobileHeader } from "@/components/MobileHeader";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ConnectionCountdown from "@/components/ConnectionCountdown"

function getRiskDisplay(state: string | null) {
  switch (state) {
    case "safe":
      return { label: "Safe connection", color: "text-green-400" };
    case "tight":
      return { label: "Tight connection", color: "text-yellow-400" };
    case "likely_missed":
      return { label: "Likely missed", color: "text-red-400" };
    case "impossible":
      return { label: "Impossible connection", color: "text-red-600" };
    default:
      return { label: "Unknown", color: "text-zinc-400" };
  }
}

export default async function TripMonitorPage({
  params
}: {
  params: { id: string };
}) {
  const { id } = params;

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

    const { data: events } = await supabase
    .from("risk_events")
    .select("*")
    .eq("trip_id", id)
    .order("created_at", { ascending: false });

  if (!trip) {
    return <div>Trip not found</div>;
  }

  const risk = getRiskDisplay(trip.monitoring_state);

  return (
    <main>
      <MobileHeader title="Monitoring" backHref="/" />

      <section className="space-y-3">

        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Trip ID
          </p>
          <p className="mt-1 font-mono text-sm text-zinc-100">{id}</p>
        </div>

        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Connection Status
          </p>

          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">

            <p className="text-xs uppercase tracking-wide text-zinc-400">
              Flight Status
            </p>

            <div className="mt-2 space-y-1 text-sm text-zinc-200">

              <p>
                Flight 1 arrival:
                <span className="font-medium text-zinc-100 ml-1">
                  {trip.estimated_arrival_f1
                    ? new Date(trip.estimated_arrival_f1).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit"
                      })
                    : "—"}
                </span>
              </p>

              <p>
                Flight 2 departure:
                <span className="font-medium text-zinc-100 ml-1">
                  {trip.scheduled_departure_f2
                    ? new Date(trip.scheduled_departure_f2).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit"
                      })
                    : "—"}
                </span>
              </p>

            </div>

          </div>

          <p className={`mt-1 text-lg font-semibold ${risk.color}`}>
            {risk.label}
          </p>

          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-400">
              Connection countdown
            </p>

            <ConnectionCountdown
              departure={trip.scheduled_departure_f2}
              arrival={trip.estimated_arrival_f1 ?? trip.scheduled_arrival_f1}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="text-sm text-zinc-200">
            Status widgets go here (gate, ETA, alerts, etc).
          </p>
        </div>

        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">

<p className="text-xs uppercase tracking-wide text-zinc-400">
  Monitoring Timeline
</p>

<div className="mt-2 space-y-2">

  {events && events.length > 0 ? (
    events.map((event) => (
      <div
        key={event.id}
        className="flex items-center justify-between text-sm"
      >
        <span className="text-zinc-400">
          {new Date(event.created_at).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit"
          })}
        </span>

        <span className="text-zinc-200">
          {event.new_state}
        </span>
      </div>
    ))
  ) : (
    <p className="text-sm text-zinc-400">
      No monitoring events yet.
    </p>
  )}

</div>

</div>

        <Link
          href={`/plan/${encodeURIComponent(id)}`}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-zinc-50 ring-1 ring-white/10 hover:bg-white/15 active:bg-white/20"
        >
          View landing plan
        </Link>

      </section>
    </main>
  );
}