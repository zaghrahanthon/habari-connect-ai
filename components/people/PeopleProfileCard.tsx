"use client";

import Link from "next/link";
import PeopleAvatar from "@/components/people/PeopleAvatar";
import type { PublicPeopleProfile } from "@/lib/peopleHelpers";
import { cn } from "@/lib/utils";

type PeopleProfileCardProps = {
  profile: PublicPeopleProfile;
  href?: string;
  featured?: boolean;
  className?: string;
};

export default function PeopleProfileCard({
  profile,
  href,
  featured = false,
  className,
}: PeopleProfileCardProps) {
  const content = (
    <>
      {profile.isNewStarter && (
        <span className="mb-3 inline-flex text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/90">
          New Starter
        </span>
      )}
      <PeopleAvatar
        imageUrl={profile.imageUrl}
        initials={profile.initials}
        alt={profile.fullName}
        size={featured ? "lg" : "md"}
        className={featured ? "mb-5" : "mb-4"}
      />
      <h3
        className={cn(
          "font-semibold text-foreground",
          featured ? "text-xl" : "text-base",
        )}
      >
        {profile.fullName}
      </h3>
      <p className="mt-1 text-sm text-accent-hover">{profile.jobTitle}</p>
      <div className="mt-3 space-y-1 text-sm text-muted">
        {profile.department ? <p>{profile.department}</p> : null}
        {profile.office ? <p>{profile.office}</p> : null}
        {profile.startDateLabel ? (
          <p>Joined {profile.startDateLabel}</p>
        ) : null}
      </div>
      {profile.shortIntro ? (
        <p
          className={cn(
            "mt-4 text-sm leading-relaxed text-foreground/85",
            featured ? "line-clamp-4" : "line-clamp-3",
          )}
        >
          “{profile.shortIntro}”
        </p>
      ) : null}
    </>
  );

  const shellClass = cn(
    "block rounded-2xl border border-border bg-card p-5 transition-colors",
    href && "hover:border-accent/40 hover:bg-card-hover",
    featured && "border-amber-500/25 bg-gradient-to-b from-amber-500/10 to-card p-6",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={shellClass}>
        {content}
      </Link>
    );
  }

  return <div className={shellClass}>{content}</div>;
}
