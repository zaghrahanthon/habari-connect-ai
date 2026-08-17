"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PEOPLE_DEPARTMENTS,
  PEOPLE_OFFICES,
} from "@/lib/peopleConstants";
import {
  fullName,
  initials,
  toPublicPeopleProfile,
  type PeopleProfileRecord,
} from "@/lib/peopleHelpers";
import PeopleAvatar from "@/components/people/PeopleAvatar";
import PeopleProfileDetail from "@/components/people/PeopleProfileDetail";

export type PeopleFormValues = {
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  office: string;
  startDate: string;
  shortIntro: string;
  bio: string;
  interests: string;
  skills: string;
  email: string;
  phone: string;
  manager: string;
  linkedInUrl: string;
  birthday: string;
  imageUrl: string;
  isNewStarter: boolean;
  isPublished: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showBirthday: boolean;
  showLinkedIn: boolean;
  displayOrder: number;
};

export const EMPTY_PEOPLE_FORM: PeopleFormValues = {
  firstName: "",
  lastName: "",
  jobTitle: "",
  department: "",
  office: "",
  startDate: "",
  shortIntro: "",
  bio: "",
  interests: "",
  skills: "",
  email: "",
  phone: "",
  manager: "",
  linkedInUrl: "",
  birthday: "",
  imageUrl: "",
  isNewStarter: true,
  isPublished: false,
  showEmail: true,
  showPhone: false,
  showBirthday: false,
  showLinkedIn: true,
  displayOrder: 0,
};

export function profileToFormValues(
  profile: PeopleProfileRecord,
): PeopleFormValues {
  const dateValue = (value: Date | string | null | undefined) => {
    if (!value) return "";
    if (typeof value === "string") return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
  };

  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    jobTitle: profile.jobTitle,
    department: profile.department ?? "",
    office: profile.office ?? "",
    startDate: dateValue(profile.startDate),
    shortIntro: profile.shortIntro ?? "",
    bio: profile.bio ?? "",
    interests: profile.interests ?? "",
    skills: profile.skills ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    manager: profile.manager ?? "",
    linkedInUrl: profile.linkedInUrl ?? "",
    birthday: dateValue(profile.birthday),
    imageUrl: profile.imageUrl ?? "",
    isNewStarter: profile.isNewStarter,
    isPublished: profile.isPublished,
    showEmail: profile.showEmail,
    showPhone: profile.showPhone,
    showBirthday: profile.showBirthday,
    showLinkedIn: profile.showLinkedIn,
    displayOrder: profile.displayOrder ?? 0,
  };
}

type PeopleProfileFormProps = {
  initial?: PeopleFormValues;
  profileId?: string;
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent";

export default function PeopleProfileForm({
  initial = EMPTY_PEOPLE_FORM,
  profileId,
}: PeopleProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<PeopleFormValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const previewProfile = useMemo(() => {
    const record: PeopleProfileRecord = {
      id: profileId ?? "preview",
      ...form,
      department: form.department || null,
      office: form.office || null,
      startDate: form.startDate || null,
      shortIntro: form.shortIntro || null,
      bio: form.bio || null,
      interests: form.interests || null,
      skills: form.skills || null,
      email: form.email || null,
      phone: form.phone || null,
      manager: form.manager || null,
      linkedInUrl: form.linkedInUrl || null,
      birthday: form.birthday || null,
      imageUrl: form.imageUrl || null,
    };
    return toPublicPeopleProfile(record);
  }, [form, profileId]);

  const setField = <K extends keyof PeopleFormValues>(
    key: K,
    value: PeopleFormValues[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const uploadImage = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/people-culture/upload", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as { imageUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      if (!data.imageUrl) throw new Error("Upload failed");
      setField("imageUrl", data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async (publish: boolean) => {
    setError(null);
    setSaving(true);
    try {
      const payload = { ...form, isPublished: publish };
      const url = profileId
        ? `/api/admin/people-culture/${profileId}`
        : "/api/admin/people-culture";
      const res = await fetch(url, {
        method: profileId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      router.push("/admin/people-culture");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          void save(form.isPublished);
        }}
      >
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground">
            Profile photo
          </h2>
          <p className="mt-1 text-sm text-muted">
            JPG, PNG or WEBP. Maximum 5 MB.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <PeopleAvatar
              imageUrl={form.imageUrl || null}
              initials={
                form.firstName || form.lastName
                  ? initials({
                      firstName: form.firstName || "?",
                      lastName: form.lastName || "?",
                    })
                  : "?"
              }
              alt={fullName(form) || "Profile photo"}
              size="lg"
            />
            <div className="space-y-2">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                disabled={uploading || saving}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadImage(file);
                  e.target.value = "";
                }}
                className="block w-full max-w-xs text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:text-white"
              />
              {form.imageUrl ? (
                <button
                  type="button"
                  className="text-sm text-muted hover:text-foreground"
                  onClick={() => setField("imageUrl", "")}
                >
                  Remove photo
                </button>
              ) : null}
              {uploading ? (
                <p className="text-sm text-muted">Uploading…</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
          <Field label="First name *">
            <input
              required
              className={inputClass}
              value={form.firstName}
              onChange={(e) => setField("firstName", e.target.value)}
            />
          </Field>
          <Field label="Last name *">
            <input
              required
              className={inputClass}
              value={form.lastName}
              onChange={(e) => setField("lastName", e.target.value)}
            />
          </Field>
          <Field label="Job title / role *">
            <input
              required
              className={inputClass}
              value={form.jobTitle}
              onChange={(e) => setField("jobTitle", e.target.value)}
            />
          </Field>
          <Field label="Department">
            <select
              className={inputClass}
              value={form.department}
              onChange={(e) => setField("department", e.target.value)}
            >
              <option value="">Select department</option>
              {PEOPLE_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Office / location">
            <select
              className={inputClass}
              value={form.office}
              onChange={(e) => setField("office", e.target.value)}
            >
              <option value="">Select office</option>
              {PEOPLE_OFFICES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start date">
            <input
              type="date"
              className={inputClass}
              value={form.startDate}
              onChange={(e) => setField("startDate", e.target.value)}
            />
          </Field>
          <Field
            label="Short introduction"
            hint={`${form.shortIntro.length}/280 — shown on cards`}
          >
            <textarea
              maxLength={280}
              rows={3}
              className={inputClass}
              value={form.shortIntro}
              onChange={(e) => setField("shortIntro", e.target.value)}
            />
          </Field>
          <Field label="Manager">
            <input
              className={inputClass}
              value={form.manager}
              onChange={(e) => setField("manager", e.target.value)}
              placeholder="e.g. Alex Naidoo"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Biography">
              <textarea
                rows={5}
                className={inputClass}
                value={form.bio}
                onChange={(e) => setField("bio", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Interests">
            <textarea
              rows={3}
              className={inputClass}
              value={form.interests}
              onChange={(e) => setField("interests", e.target.value)}
            />
          </Field>
          <Field label="Skills">
            <textarea
              rows={3}
              className={inputClass}
              value={form.skills}
              onChange={(e) => setField("skills", e.target.value)}
            />
          </Field>
          <Field label="Email" hint="Internal contact email">
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
          </Field>
          <Field label="Phone" hint="Only if meant to be shared internally">
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </Field>
          <Field label="LinkedIn URL">
            <input
              type="url"
              placeholder="https://www.linkedin.com/in/…"
              className={inputClass}
              value={form.linkedInUrl}
              onChange={(e) => setField("linkedInUrl", e.target.value)}
            />
          </Field>
          <Field label="Birthday" hint="Optional — hidden from employees by default">
            <input
              type="date"
              className={inputClass}
              value={form.birthday}
              onChange={(e) => setField("birthday", e.target.value)}
            />
          </Field>
          <Field label="Display order" hint="Lower numbers appear first">
            <input
              type="number"
              className={inputClass}
              value={form.displayOrder}
              onChange={(e) =>
                setField("displayOrder", Number(e.target.value) || 0)
              }
            />
          </Field>
        </section>

        <section className="grid gap-3 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isNewStarter}
              onChange={(e) => setField("isNewStarter", e.target.checked)}
            />
            New Starter label
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.showEmail}
              onChange={(e) => setField("showEmail", e.target.checked)}
            />
            Show email to employees
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.showPhone}
              onChange={(e) => setField("showPhone", e.target.checked)}
            />
            Show phone to employees
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.showBirthday}
              onChange={(e) => setField("showBirthday", e.target.checked)}
            />
            Show birthday to employees
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.showLinkedIn}
              onChange={(e) => setField("showLinkedIn", e.target.checked)}
            />
            Show LinkedIn to employees
          </label>
        </section>

        {/*
          Privacy: Never put salary, leave balances, disciplinary notes,
          ID numbers, or home addresses into PeopleProfile fields.
        */}

        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving || uploading}
            onClick={() => void save(false)}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card-hover disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={saving || uploading}
            onClick={() => void save(true)}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            Publish Profile
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="rounded-xl border border-border px-4 py-2.5 text-sm text-foreground hover:bg-card-hover"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/people-culture")}
            className="rounded-xl px-4 py-2.5 text-sm text-muted hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </form>

      {showPreview ? (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-8">
          <button
            type="button"
            className="absolute inset-0 bg-black/75"
            aria-label="Close preview"
            onClick={() => setShowPreview(false)}
          />
          <div className="relative mx-auto max-w-3xl rounded-2xl border border-border bg-background p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Employee preview
                </p>
                <p className="text-xs text-muted">
                  Approximate view of the employee-facing profile page
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-xl border border-border px-3 py-1.5 text-sm"
              >
                Close
              </button>
            </div>
            <PeopleProfileDetail profile={previewProfile} />
          </div>
        </div>
      ) : null}
    </>
  );
}
