import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-card", className)}
      aria-hidden
    />
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5",
        className,
      )}
    >
      <Skeleton className="h-4 w-1/3 bg-background" />
      <Skeleton className="mt-4 h-8 w-1/2 bg-background" />
      <Skeleton className="mt-3 h-3 w-2/3 bg-background" />
    </div>
  );
}

export function SkeletonRows({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
