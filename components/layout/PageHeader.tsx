import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  breadcrumb?: React.ReactNode;
};

/** Consistent page title + short description + optional actions */
export default function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
  breadcrumb,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 max-w-2xl">
        {breadcrumb ? <div className="mb-3">{breadcrumb}</div> : null}
        <div className="flex items-start gap-3">
          {icon ? (
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-hover">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
