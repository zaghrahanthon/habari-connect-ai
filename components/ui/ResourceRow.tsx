import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type ResourceRowProps = {
  title: string;
  description?: string | null;
  category?: string | null;
  fileType?: string | null;
  href: string;
  className?: string;
};

export default function ResourceRow({
  title,
  description,
  category,
  fileType,
  href,
  className,
}: ResourceRowProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:border-accent/35 hover:bg-card-hover",
        className,
      )}
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-accent-hover">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-foreground">{title}</p>
          {fileType ? (
            <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-accent-hover">
              {fileType}
            </span>
          ) : null}
        </div>
        {category ? (
          <p className="mt-0.5 text-xs text-muted">{category}</p>
        ) : null}
        {description ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted">{description}</p>
        ) : null}
      </div>
      <span className="shrink-0 text-xs font-medium text-accent">Open →</span>
    </a>
  );
}
