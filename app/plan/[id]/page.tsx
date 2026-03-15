import { MobileHeader } from "@/components/MobileHeader";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function LandingPlanPage({
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

  if (!plan) {
    return (
      <main>
        <MobileHeader title="Landing plan" backHref={`/trip/${id}`} />

        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="text-sm text-zinc-300">
            No recovery plan generated yet.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <MobileHeader title="Landing plan" backHref={`/trip/${id}`} />

      <section className="space-y-3">

        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Plan created
          </p>

          <p className="text-sm text-zinc-100 mt-1">
            {new Date(plan.created_at).toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Reason
          </p>

          <p className="text-sm text-zinc-100 mt-1">
            {plan.reason}
          </p>
        </div>

      </section>
    </main>
  );
}