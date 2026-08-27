import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminSectionHeaderProps = {
  title: string;
  description: string;
  employeePath: string;
  actions?: React.ReactNode;
  className?: string;
};

/** Shows which employee section this admin page controls */
export default function AdminSectionHeader({
  title,
  description,
  employeePath,
  actions,
  className,
}: AdminSectionHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Admin · Employee section
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Manage what employees see in {title}. {description}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link
          href={employeePath}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/35 hover:bg-card-hover"
        >
          View employee page
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        {actions}
      </div>
    </header>
  );
}
