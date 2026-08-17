"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import PeopleProfileDetail from "@/components/people/PeopleProfileDetail";
import type { PublicPeopleProfile } from "@/lib/peopleHelpers";
import { ArrowLeft } from "lucide-react";

export default function PeopleCultureDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [profile, setProfile] = useState<PublicPeopleProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/people-culture/${id}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Profile not found");
        if (!cancelled) setProfile(data as PublicPeopleProfile);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Profile not found");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/dashboard/people-culture"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to People & Culture
        </Link>

        <div className="mt-6">
          {loading ? (
            <div className="h-96 animate-pulse rounded-3xl bg-card" />
          ) : null}
          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}
          {profile ? <PeopleProfileDetail profile={profile} /> : null}
        </div>
      </div>
    </DashboardShell>
  );
}
