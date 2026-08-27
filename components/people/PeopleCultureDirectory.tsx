"use client";

import { useEffect, useMemo, useState } from "react";
import PeopleProfileCard from "@/components/people/PeopleProfileCard";
import EmptyState from "@/components/layout/EmptyState";
import { SectionTitle } from "@/components/layout/SectionCard";
import SectionCard from "@/components/layout/SectionCard";
import { Skeleton } from "@/components/layout/Skeleton";
import {
  PEOPLE_DEPARTMENTS,
  PEOPLE_OFFICES,
} from "@/lib/peopleConstants";
import type { PublicPeopleProfile } from "@/lib/peopleHelpers";
import { Users } from "lucide-react";

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
    <div className="mt-8 space-y-10">
      <SectionCard padding="sm" className="!p-3 sm:!p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people…"
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
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
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
          >
            <option value="">All offices</option>
            {PEOPLE_OFFICES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <section>
        <SectionTitle
          title="New to Habari"
          description="Say hello to the newest members of the Habari team."
        />

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : newStarters.length === 0 ? (
          <EmptyState
            compact
            icon={<Users className="h-5 w-5" />}
            title="No new starters right now"
            description="Published new-starter profiles will appear here."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <SectionTitle
          title="Our People"
          description="Browse everyone with a published People & Culture profile."
        />

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        ) : filteredPeople.length === 0 ? (
          <EmptyState
            compact
            icon={<Users className="h-5 w-5" />}
            title="No profiles found"
            description="Try changing your search or filters."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
