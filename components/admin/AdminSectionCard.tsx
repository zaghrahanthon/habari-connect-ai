import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminSectionStat = {
  label: string;
  value: number | string;
};

type AdminSectionCardProps = {
  title: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  stats: AdminSectionStat[];
  className?: string;
};

export default function AdminSectionCard({
  title,
  description,
  href,
  icon: Icon,
  stats,
  className,
}: AdminSectionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-accent/35 hover:bg-card-hover",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-hover">
          <Icon className="h-5 w-5" />
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
          Manage
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 line-clamp-2 text-xs text-muted">{description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
        {stats.map((stat) => (
          <p key={stat.label} className="text-sm text-muted">
            <span className="font-semibold text-foreground">{stat.value}</span>{" "}
            {stat.label}
          </p>
        ))}
      </div>
      <span className="mt-4 inline-flex w-fit rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors group-hover:border-accent/40">
        Manage
      </span>
    </Link>
  );
}
