import Link from "next/link";
import { cn } from "@/lib/utils";

type QuickActionCardProps = {
  href: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  className?: string;
};

/** Compact icon card for home quick actions */
export default function QuickActionCard({
  href,
  title,
  description,
  icon,
  className,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-accent/35 hover:bg-card-hover",
        className,
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-hover transition-colors group-hover:bg-accent/25">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
