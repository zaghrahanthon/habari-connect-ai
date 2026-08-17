"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import PeopleProfileForm, {
  profileToFormValues,
  type PeopleFormValues,
} from "@/components/admin/PeopleProfileForm";
import type { PeopleProfileRecord } from "@/lib/peopleHelpers";

export default function AdminPeopleCultureEditPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [initial, setInitial] = useState<PeopleFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/admin/people-culture/${id}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Not found");
        if (!cancelled) {
          setInitial(profileToFormValues(data as PeopleProfileRecord));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-foreground">
          Edit Employee Profile
        </h1>
        <p className="mt-1 text-sm text-muted">
          Update details, change publish status, or refresh the profile photo.
        </p>
        <div className="mt-8">
          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}
          {!error && !initial ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : null}
          {initial ? (
            <PeopleProfileForm initial={initial} profileId={id} />
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}
