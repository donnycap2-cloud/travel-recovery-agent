export const dynamic = "force-dynamic";
export const revalidate = 0;

import { unstable_noStore as noStore } from "next/cache";

import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { MobileHeader } from "@/components/MobileHeader"

export default async function HomePage() {
  noStore();
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

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

        {(!trips || trips.length === 0) && (
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="text-sm text-zinc-400">
              No trips added yet.
            </p>
          </div>
        )}

        {trips?.map((trip) => (

          <Link
            key={trip.id}
            href={`/trip/${trip.id}`}
            className="block rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
          >

            <p className="text-sm text-zinc-400">
              {trip.origin_airport} → {trip.destination_airport}
            </p>

            <p className="text-sm text-zinc-200 mt-1">
              Connection at {trip.connection_airport}
            </p>

            <p className="text-xs text-zinc-500 mt-2">
              Status: {trip.monitoring_state ?? "unknown"}
            </p>

          </Link>

        ))}

      </section>

    </main>
  )
}
