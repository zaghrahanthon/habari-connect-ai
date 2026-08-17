"use client";

import { useEffect, useMemo, useState } from "react";
import PeopleProfileCard from "@/components/people/PeopleProfileCard";
import {
  PEOPLE_DEPARTMENTS,
  PEOPLE_OFFICES,
} from "@/lib/peopleConstants";
import type { PublicPeopleProfile } from "@/lib/peopleHelpers";

export default function PeopleCultureDirectory() {
  const [profiles, setProfiles] = useState<PublicPeopleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("");
  const [office, setOffice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/people-culture", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "Unable to load people",
          );
        }
        if (!cancelled) {
          setProfiles(Array.isArray(data.profiles) ? data.profiles : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load people",
          );
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

  const newStarters = useMemo(
    () =>
      profiles
        .filter((p) => p.isNewStarter)
        .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? "")),
    [profiles],
  );

  const filteredPeople = useMemo(() => {
    const term = q.trim().toLowerCase();
    return profiles.filter((p) => {
      if (department && (p.department ?? "") !== department) return false;
      if (office && (p.office ?? "") !== office) return false;
      if (!term) return true;
      const haystack = [p.fullName, p.jobTitle, p.department, p.office]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [profiles, q, department, office]);

  return (
    <div className="mt-10 space-y-14">
      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <section>
        <h2 className="text-xl font-semibold text-foreground">
          Meet Our New Starters
        </h2>
        <p className="mt-1 text-sm text-muted">
          Say hello to the newest members of the Habari team.
        </p>

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : newStarters.length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            No new starters are published right now.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {newStarters.map((profile) => (
              <PeopleProfileCard
                key={profile.id}
                profile={profile}
                featured
                href={`/dashboard/people-culture/${profile.id}`}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Our People</h2>
            <p className="mt-1 text-sm text-muted">
              Browse everyone with a published People & Culture profile.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or role…"
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm sm:col-span-1"
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
          >
            <option value="">All departments</option>
            {PEOPLE_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={office}
            onChange={(e) => setOffice(e.target.value)}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
          >
            <option value="">All offices</option>
            {PEOPLE_OFFICES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : filteredPeople.length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            No published profiles match your filters.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPeople.map((profile) => (
              <PeopleProfileCard
                key={profile.id}
                profile={profile}
                href={`/dashboard/people-culture/${profile.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
