import Link from "next/link";

const base =
  "inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-100 active:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed";

export function PrimaryButton({
  children,
  href
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href} className={base}>
      {children}
    </Link>
  );
}

