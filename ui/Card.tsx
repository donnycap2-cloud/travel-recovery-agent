import { cn } from "@/lib/cn";

export function Card({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl bg-white/5 p-4 ring-1 ring-white/10", className)}>
      {children}
    </div>
  );
}

