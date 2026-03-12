import Link from "next/link";

export function MobileHeader({
  title,
  backHref,
  rightSlot
}: {
  title: string;
  backHref?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex items-center gap-3">
      <div className="w-14">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center rounded-full bg-white/10 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/15 active:bg-white/20"
            aria-label="Back"
          >
            Back
          </Link>
        ) : null}
      </div>

      <h1 className="flex-1 text-center text-base font-semibold tracking-tight text-zinc-50">
        {title}
      </h1>

      <div className="flex w-14 justify-end">{rightSlot}</div>
    </header>
  );
}

