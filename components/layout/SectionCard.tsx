import { cn } from "@/lib/utils";

type SectionCardProps = {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
};

const PADDING = {
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
} as const;

/** Shared dashboard card surface — consistent radius, border, padding */
export default function SectionCard({
  children,
  className,
  padding = "md",
  hover = false,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card",
        PADDING[padding],
        hover && "transition-colors hover:border-accent/30 hover:bg-card-hover",
        className,
      )}
    >
      {children}
    </div>
  );
}

type SectionTitleProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function SectionTitle({
  title,
  description,
  action,
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-end justify-between gap-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
