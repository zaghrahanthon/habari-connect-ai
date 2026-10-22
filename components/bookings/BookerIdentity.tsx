"use client";

import Link from "next/link";
import PeopleAvatar from "@/components/people/PeopleAvatar";
import type { BookedBy } from "@/lib/bookings/booker";
import { cn } from "@/lib/utils";

export default function BookerIdentity({
  bookedBy,
  compact = false,
  className,
}: {
  bookedBy: BookedBy;
  compact?: boolean;
  className?: string;
}) {
  const body = (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <PeopleAvatar
        imageUrl={bookedBy.imageUrl}
        initials={bookedBy.initials}
        alt={bookedBy.name}
        size="sm"
        className={cn("rounded-full", compact ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs")}
      />
      <span className="min-w-0">
        <span className="block truncate text-sm text-foreground">{bookedBy.name}</span>
        {bookedBy.jobTitle && !compact ? (
          <span className="block truncate text-xs text-muted">{bookedBy.jobTitle}</span>
        ) : null}
      </span>
    </span>
  );

  if (bookedBy.profileHref) {
    return (
      <Link
        href={bookedBy.profileHref}
        onClick={(event) => event.stopPropagation()}
        className="inline-flex min-w-0 rounded-lg hover:opacity-90"
      >
        {body}
      </Link>
    );
  }

  return body;
}
