import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SectionQuickAction } from "@/lib/sectionHubConfig";

type QuickActionGridProps = {
  actions: SectionQuickAction[];
  className?: string;
};

export default function QuickActionGrid({
  actions,
  className,
}: QuickActionGridProps) {
  if (actions.length === 0) return null;

  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.id}
            href={action.href}
            className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-accent/35 hover:bg-card-hover"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-hover">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {action.title}
                </p>
                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                {action.description}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
