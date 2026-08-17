import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  published?: boolean;
  aiVisible?: boolean;
  employeeVisible?: boolean;
  className?: string;
};

export function PublishBadge({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        published
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-zinc-500/15 text-zinc-400",
      )}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

export function VisibilityBadges({
  aiVisible,
  employeeVisible,
}: {
  aiVisible?: boolean;
  employeeVisible?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {aiVisible !== undefined && (
        <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs text-indigo-300">
          {aiVisible ? "Visible to AI" : "Hidden from AI"}
        </span>
      )}
      {employeeVisible !== undefined && (
        <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs text-sky-300">
          {employeeVisible ? "Visible to Employees" : "Hidden from Employees"}
        </span>
      )}
    </div>
  );
}

export default function StatusBadge({ published, className }: StatusBadgeProps) {
  if (published === undefined) return null;
  return (
    <div className={className}>
      <PublishBadge published={published} />
    </div>
  );
}
