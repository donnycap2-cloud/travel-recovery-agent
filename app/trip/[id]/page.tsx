import { MobileHeader } from "@/components/MobileHeader";
import Link from "next/link";

export default async function TripMonitorPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
          <p className="text-sm text-zinc-200">
            Status widgets go here (gate, ETA, alerts, etc).
          </p>
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

