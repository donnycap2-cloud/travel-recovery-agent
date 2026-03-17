import { MobileHeader } from "@/components/MobileHeader";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function formatTime(time: string) {
  return new Date(time).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatDuration(dep: string, arr: string) {
  const diff = new Date(arr).getTime() - new Date(dep).getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function getRecoveryReason(option: any, index: number, trip: any) {
  const originalAirline = trip?.flight_2_number?.slice(0, 2);

  if (option.flightNumber?.startsWith(originalAirline)) {
    return "Same airline as your missed connection";
  }

  if (index === 0) {
    return "Fastest arrival to your destination";
  }

  if (index === 1) {
    return "Second fastest arrival option";
  }

  return "Alternative recovery option";
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

  const best = plan?.options?.[0];
  const alternatives = plan?.options?.slice(1) ?? [];

  return (
    <main>
      <MobileHeader title="Recovery Plan" backHref={`/trip/${id}`} />

      <section className="space-y-3">

        {/* 🔴 Delay impact */}
        {delayImpact && (
          <div className="rounded-2xl bg-red-500/10 p-4 ring-1 ring-red-500/20">
            <p className="text-sm text-red-300">
              {delayImpact}
            </p>
          </div>
        )}

        {/* ❌ No plan */}
        {!plan || !plan.options || plan.options.length === 0 ? (
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="text-sm text-zinc-400">
              No recovery plan generated yet.
            </p>
          </div>
        ) : (
          <>
            {/* 🟢 Recommended action */}
            {best && (
              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 space-y-3">

                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Recommended action
                </p>

                <p className="text-lg font-semibold text-green-400">
                  Take {best.airline} {best.flightNumber}
                </p>

                <p className="text-sm text-zinc-300">
                  Departs {formatTime(best.departure)} • Arrives {formatTime(best.arrival)}
                </p>

                <p className="text-sm text-zinc-400">
                  {best.origin || trip.connection_airport} → {best.destination || trip.destination_airport} •{" "}
                  {formatDuration(best.departure, best.arrival)}
                </p>

              </div>
            )}

            {/* 🧠 Why */}
            {best && (
              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">

                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Why
                </p>

                <p className="mt-1 text-sm text-zinc-200">
                  {getRecoveryReason(best, 0, trip)}. This option gets you to your destination the earliest after your missed connection.
                </p>

              </div>
            )}

            {/* ⚡ What to do now */}
            {best && (
              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">

                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  What to do now
                </p>

                <ul className="mt-2 space-y-2 text-sm text-zinc-200">
                  <li>• Open your airline app</li>
                  <li>• Search for {best.airline} {best.flightNumber}</li>
                  <li>• Rebook immediately before seats fill</li>
                </ul>

              </div>
            )}

            {/* 🛬 After landing */}
            {best && (
              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">

                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  After landing
                </p>

                <ul className="mt-2 space-y-2 text-sm text-zinc-200">
                  <li>• Check your gate for the new flight</li>
                  <li>• Head directly to boarding</li>
                  <li>• Monitor for any further delays</li>
                </ul>

              </div>
            )}

            {/* 🔽 Other options */}
            {alternatives.length > 0 && (
              <div className="space-y-2">

                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  Other options
                </p>

                {alternatives.map((option: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
                  >
                    <p className="text-sm font-semibold text-zinc-100">
                      {option.airline} {option.flightNumber}
                    </p>

                    <p className="text-xs text-zinc-400">
                      Departs {formatTime(option.departure)} • Arrives {formatTime(option.arrival)}
                    </p>
                  </div>
                ))}

              </div>
            )}
          </>
        )}

      </section>
    </main>
  );
}