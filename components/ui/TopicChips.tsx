import Link from "next/link";
import { cn } from "@/lib/utils";

type TopicChipProps = {
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

export function TopicChip({
  label,
  href,
  active,
  onClick,
  className,
}: TopicChipProps) {
  const styles = cn(
    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
    active
      ? "border-accent/40 bg-accent/15 text-accent-hover"
      : "border-border bg-card text-muted hover:border-accent/30 hover:text-foreground",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={styles}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={styles}>
      {label}
    </button>
  );
}

export function TopicChipRow({
  labels,
  className,
}: {
  labels: string[];
  className?: string;
}) {
  if (labels.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {labels.map((label) => (
        <TopicChip key={label} label={label} href="#help-articles" />
      ))}
    </div>
  );
}
