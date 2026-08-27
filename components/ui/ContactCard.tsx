import { Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type ContactCardProps = {
  name: string;
  jobTitle?: string | null;
  department?: string | null;
  office?: string | null;
  email?: string | null;
  phone?: string | null;
  className?: string;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ContactCard({
  name,
  jobTitle,
  department,
  office,
  email,
  phone,
  className,
}: ContactCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-card p-4 transition-colors hover:border-accent/30",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent-hover">
          {initials(name) || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{name}</p>
          {jobTitle ? (
            <p className="mt-0.5 text-sm text-muted">{jobTitle}</p>
          ) : null}
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted">
            {department ? <span>{department}</span> : null}
            {office ? <span>· {office}</span> : null}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {email ? (
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:border-accent/40"
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </a>
        ) : null}
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent/40"
          >
            <Phone className="h-3.5 w-3.5" />
            Call
          </a>
        ) : null}
      </div>
    </article>
  );
}
