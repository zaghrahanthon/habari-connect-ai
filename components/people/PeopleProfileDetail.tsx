"use client";

import PeopleAvatar from "@/components/people/PeopleAvatar";
import type { PublicPeopleProfile } from "@/lib/peopleHelpers";

type PeopleProfileDetailProps = {
  profile: PublicPeopleProfile;
};

function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </h2>
      <div className="mt-2 text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </div>
  );
}

export default function PeopleProfileDetail({
  profile,
}: PeopleProfileDetailProps) {
  return (
    <article className="mx-auto max-w-3xl">
      <div
        className={
          profile.isNewStarter
            ? "rounded-3xl border border-amber-500/25 bg-gradient-to-b from-amber-500/10 via-card to-card p-6 sm:p-8"
            : "rounded-3xl border border-border bg-card p-6 sm:p-8"
        }
      >
        {profile.isNewStarter ? (
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
            New Starter
          </p>
        ) : null}

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <PeopleAvatar
            imageUrl={profile.imageUrl}
            initials={profile.initials}
            alt={profile.fullName}
            size="xl"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {profile.fullName}
            </h1>
            <p className="mt-2 text-lg text-accent-hover">{profile.jobTitle}</p>
            <div className="mt-4 space-y-1 text-sm text-muted">
              {profile.department ? <p>{profile.department}</p> : null}
              {profile.office ? <p>{profile.office}</p> : null}
              {profile.startDateLabel ? (
                <p>Joined {profile.startDateLabel}</p>
              ) : null}
            </div>
            {profile.shortIntro ? (
              <p className="mt-5 text-base leading-relaxed text-foreground/90">
                “{profile.shortIntro}”
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 space-y-6 border-t border-border/70 pt-8">
          {profile.bio ? (
            <DetailBlock label="Biography">
              <p className="whitespace-pre-wrap">{profile.bio}</p>
            </DetailBlock>
          ) : null}
          {profile.interests ? (
            <DetailBlock label="Interests">
              <p className="whitespace-pre-wrap">{profile.interests}</p>
            </DetailBlock>
          ) : null}
          {profile.skills ? (
            <DetailBlock label="Skills">
              <p className="whitespace-pre-wrap">{profile.skills}</p>
            </DetailBlock>
          ) : null}
          {profile.manager ? (
            <DetailBlock label="Manager">{profile.manager}</DetailBlock>
          ) : null}
          {profile.email ? (
            <DetailBlock label="Email">
              <a
                href={`mailto:${profile.email}`}
                className="text-accent hover:text-accent-hover"
              >
                {profile.email}
              </a>
            </DetailBlock>
          ) : null}
          {profile.phone ? (
            <DetailBlock label="Phone">
              <a
                href={`tel:${profile.phone}`}
                className="text-accent hover:text-accent-hover"
              >
                {profile.phone}
              </a>
            </DetailBlock>
          ) : null}
          {profile.linkedInUrl ? (
            <DetailBlock label="LinkedIn">
              <a
                href={profile.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:border-accent/40"
              >
                View LinkedIn profile
              </a>
            </DetailBlock>
          ) : null}
          {profile.birthdayLabel ? (
            <DetailBlock label="Birthday">{profile.birthdayLabel}</DetailBlock>
          ) : null}
        </div>
      </div>
    </article>
  );
}
