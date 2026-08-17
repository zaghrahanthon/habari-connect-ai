"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PublicPeopleProfile } from "@/lib/peopleHelpers";

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

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fail silently for the main dashboard experience
  if (failed) return null;
  if (!loading && profiles.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">New to Habari</h2>
        <Link
          href="/dashboard/people-culture"
          className="text-sm font-medium text-accent hover:text-accent-hover"
        >
          View People & Culture →
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-background" />
          ))}
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {profiles.map((profile) => (
            <li
              key={profile.id}
              className="rounded-xl border border-border bg-background px-4 py-3"
            >
              <Link
                href={`/dashboard/people-culture/${profile.id}`}
                className="block hover:opacity-90"
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
