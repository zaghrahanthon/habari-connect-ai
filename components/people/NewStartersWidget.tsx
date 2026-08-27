"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PublicPeopleProfile } from "@/lib/peopleHelpers";
import EmptyState from "@/components/layout/EmptyState";
import { Users } from "lucide-react";

export default function NewStartersWidget() {
  const [profiles, setProfiles] = useState<PublicPeopleProfile[]>([]);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          "/api/people-culture?newStarter=true&limit=3",
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error("unavailable");
        const data = (await res.json()) as {
          profiles?: PublicPeopleProfile[];
        };
        if (!cancelled) {
          setProfiles(data.profiles ?? []);
          setFailed(false);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
          setProfiles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const boot = window.setTimeout(() => {
      void load();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(boot);
    };
  }, []);

  return (
    <section className="h-full rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">New to Habari</h2>
          <p className="mt-0.5 text-xs text-muted">Recent new starters</p>
        </div>
        <Link
          href="/dashboard/people-culture"
          className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-background"
            />
          ))}
        </div>
      ) : failed ? (
        <p className="mt-4 text-sm text-muted">
          New starter updates are temporarily unavailable.
        </p>
      ) : profiles.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            compact
            icon={<Users className="h-5 w-5" />}
            title="No new starters published"
            description="New team members will appear here when published."
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {profiles.map((profile) => (
            <li
              key={profile.id}
              className="rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:border-accent/30"
            >
              <Link
                href={`/dashboard/people-culture/${profile.id}`}
                className="block"
              >
                <p className="font-medium text-foreground">{profile.fullName}</p>
                <p className="mt-1 text-sm text-muted">{profile.jobTitle}</p>
                <p className="mt-2 text-sm text-foreground/80">
                  Welcome {profile.firstName}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
