import { MobileHeader } from "@/components/MobileHeader";

export default async function LandingPlanPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main>
      <MobileHeader title="Landing plan" backHref={`/trip/${encodeURIComponent(id)}`} />

      <section className="space-y-3">
        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            For trip
          </p>
          <p className="mt-1 font-mono text-sm text-zinc-100">{id}</p>
        </div>

        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <ul className="space-y-2 text-sm text-zinc-200">
            <li className="flex items-center justify-between">
              <span>Bag claim</span>
              <span className="text-zinc-400">TBD</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Ride pickup</span>
              <span className="text-zinc-400">TBD</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Next stop</span>
              <span className="text-zinc-400">TBD</span>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}

