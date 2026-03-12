import { MobileHeader } from "@/components/MobileHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <MobileHeader title="Trip PWA" />

      <section className="space-y-3">
        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="text-sm text-zinc-200">
            Mobile-first starter with App Router + Tailwind. This is a stub home
            screen that links into the flow.
          </p>
        </div>

        <PrimaryButton href="/add-trip">Add a trip</PrimaryButton>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/trip/demo"
            className="rounded-2xl bg-white/5 p-4 text-sm text-zinc-100 ring-1 ring-white/10 hover:bg-white/10"
          >
            Monitoring (demo)
          </Link>
          <Link
            href="/plan/demo"
            className="rounded-2xl bg-white/5 p-4 text-sm text-zinc-100 ring-1 ring-white/10 hover:bg-white/10"
          >
            Landing plan (demo)
          </Link>
        </div>
      </section>
    </main>
  );
}

