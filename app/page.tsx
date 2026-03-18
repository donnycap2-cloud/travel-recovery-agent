export const dynamic = "force-dynamic";
export const revalidate = 0;

import { unstable_noStore as noStore } from "next/cache";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { MobileHeader } from "@/components/MobileHeader";

function getStatusUI(state: string | null) {
  switch (state) {
    case "safe":
      return { label: "Safe", color: "text-green-400" };
    case "tight":
      return { label: "Tight", color: "text-yellow-400" };
    case "likely_missed":
      return { label: "Likely missed", color: "text-red-400" };
    case "impossible":
      return { label: "Missed", color: "text-red-600" };
    default:
      return { label: "Unknown", color: "text-zinc-400" };
  }
}

export default async function HomePage() {
  noStore();

  const { data: trips } = await supabase
    .from("trips")
    .select("*");

  // 🔥 Sort by urgency instead of just created_at
  const sortedTrips = trips?.sort((a, b) => {
    const priority: Record<string, number> = {
      impossible: 0,
      likely_missed: 1,
      tight: 2,
      safe: 3
    };

    return (priority[a.monitoring_state ?? "safe"] ?? 4) -
           (priority[b.monitoring_state ?? "safe"] ?? 4);
  });

  return (
    <main>
      <MobileHeader title="Trips" />

      <section className="space-y-3">

        <Link
          href="/add-trip"
          className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900"
        >
          Add Trip
        </Link>

        {(!sortedTrips || sortedTrips.length === 0) && (
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="text-sm text-zinc-400">
              No trips added yet.
            </p>
          </div>
        )}

        {sortedTrips?.map((trip) => {
          const status = getStatusUI(trip.monitoring_state);

          return (
            <Link
              key={trip.id}
              href={`/trip/${trip.id}`}
              className={`block rounded-2xl p-4 ring-1 ${
                trip.monitoring_state === "likely_missed" ||
                trip.monitoring_state === "impossible"
                  ? "bg-red-500/10 ring-red-500/20"
                  : trip.monitoring_state === "tight"
                  ? "bg-yellow-500/10 ring-yellow-500/20"
                  : "bg-white/5 ring-white/10"
              }`}
            >
              {/* Route */}
              <p className="text-sm text-zinc-400">
                {trip.origin_airport} → {trip.destination_airport}
              </p>

              {/* Connection */}
              <p className="text-sm text-zinc-200 mt-1">
                Connection at {trip.connection_airport}
              </p>

              {/* Time context */}
              <p className="text-xs text-zinc-500 mt-1">
                Departs{" "}
                {trip.scheduled_departure_f1
                  ? new Date(trip.scheduled_departure_f1).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit"
                    })
                  : "—"}
              </p>

              {/* Status */}
              <p className={`text-xs mt-2 font-medium ${status.color}`}>
                {status.label}
              </p>
            </Link>
          );
        })}

      </section>
    </main>
  );
}