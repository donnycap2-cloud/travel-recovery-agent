import { MobileHeader } from "@/components/MobileHeader";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function formatTime(time: string) {
  return new Date(time).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function getDelayImpact(trip: any) {
  if (!trip?.estimated_arrival_f1 || !trip?.scheduled_departure_f2) {
    return null;
  }

  const arrival = new Date(trip.estimated_arrival_f1).getTime();
  const departure = new Date(trip.scheduled_departure_f2).getTime();

  const diffMinutes = Math.round((arrival - departure) / 60000);

  if (diffMinutes <= 0) return null;

  return `You will miss your connection by ${diffMinutes} minutes.`;
}

export default async function PlanPage({
  params
}: {
  params: { id: string };
}) {
  const { id } = params;

  const { data: plan } = await supabase
    .from("landing_plans")
    .select("*")
    .eq("trip_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  const delayImpact = getDelayImpact(trip);

  return (
    <main>
      <MobileHeader title="Recovery Plan" backHref={`/trip/${id}`} />

      <section className="space-y-3">

        {delayImpact && (
    <div className="rounded-2xl bg-red-500/10 p-4 ring-1 ring-red-500/20">
      <p className="text-sm text-red-300">
        {delayImpact}
      </p>
    </div>
  )}

        {!plan || !plan.options || plan.options.length === 0 ? (
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="text-sm text-zinc-400">
              No recovery plan generated yet.
            </p>
          </div>
        ) : (
          plan.options.map((option: any, index: number) => (
            <div
              key={index}
              className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Option {index + 1}
                </p>

                {index === 0 && (
                  <span className="text-xs font-semibold text-green-400">
                    Best option
                  </span>
                )}
              </div>

              <p className="mt-1 text-lg font-semibold text-zinc-50">
                {option.airline} {option.flightNumber}
              </p>

              <p className="text-sm text-zinc-400">
                {option.origin || trip.connection_airport} → {option.destination || trip.destination_airport}
              </p>

              <p className="text-sm text-zinc-400">
                {option.duration}
              </p>

              <p className="mt-1 text-sm text-zinc-200">
                Departs {formatTime(option.departure)}
              </p>

              <p className="text-sm text-zinc-200">
                Arrives {formatTime(option.arrival)}
              </p>
            </div>
          ))
        )}

      </section>
    </main>
  );
}