"use client";

import AdminShell from "@/components/admin/AdminShell";
import PeopleProfileForm from "@/components/admin/PeopleProfileForm";

export default function AdminPeopleCultureNewPage() {
  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-foreground">
          Add Employee Profile
        </h1>
        <p className="mt-1 text-sm text-muted">
          Create a draft or publish immediately for employees on the office
          network.
        </p>
        <div className="mt-8">
          <PeopleProfileForm />
        </div>
      </div>
    </AdminShell>
  );
}
