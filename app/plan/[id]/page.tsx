import { MobileHeader } from "@/components/MobileHeader";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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

  return (
    <main>
      <MobileHeader title="Recovery Plan" backHref={`/trip/${id}`} />

      <section className="space-y-3">

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
              <p className="text-xs uppercase tracking-wide text-zinc-400">
                Option {index + 1}
              </p>

              <p className="mt-1 text-lg font-semibold text-zinc-50">
                {option.flightNumber}
              </p>

              <p className="mt-1 text-sm text-zinc-200">
                Departs {option.departure}
              </p>

              <p className="text-sm text-zinc-200">
                Arrives {option.arrival}
              </p>
            </div>
          ))
        )}

      </section>
    </main>
  );
}