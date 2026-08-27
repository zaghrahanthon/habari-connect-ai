"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";
import { SkeletonRows } from "@/components/layout/Skeleton";
import ContactCard from "@/components/ui/ContactCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { TopicChip } from "@/components/ui/TopicChips";
import { Phone } from "lucide-react";

type Contact = {
  id: string;
  name: string;
  jobTitle: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  office: string | null;
};

const DEPARTMENTS = [
  "HR",
  "IT",
  "Finance",
  "Marketing",
  "Sales",
  "Editorial",
  "Management",
];

export default function QuickContactsPage() {
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/contacts?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => setContacts(Array.isArray(data) ? data : []))
        .catch(() => setContacts([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filtered = useMemo(() => {
    if (!departmentFilter) return contacts;
    return contacts.filter(
      (c) =>
        (c.department ?? "").toLowerCase() === departmentFilter.toLowerCase(),
    );
  }, [contacts, departmentFilter]);

  return (
    <DashboardShell>
      <PageContainer>
        <PageHeader
          title="Quick Contacts"
          description="Find the right person quickly. Search by name, role or department."
          icon={<Phone className="h-5 w-5" />}
        />

        <div className="mt-8 space-y-8">
          <div>
            <input
              type="search"
              placeholder="Search by name, role or department…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-base outline-none transition-colors focus:border-accent"
            />
          </div>

          <section>
            <SectionHeader title="Departments" />
            <div className="flex flex-wrap gap-2">
              <TopicChip
                label="All"
                active={!departmentFilter}
                onClick={() => setDepartmentFilter("")}
              />
              {DEPARTMENTS.map((dept) => (
                <TopicChip
                  key={dept}
                  label={dept}
                  active={departmentFilter === dept}
                  onClick={() => setDepartmentFilter(dept)}
                />
              ))}
            </div>
          </section>

          <section>
            <SectionHeader
              title="People"
              description={
                loading
                  ? "Loading contacts…"
                  : `${filtered.length} contact${filtered.length === 1 ? "" : "s"}`
              }
            />
            {loading ? (
              <SkeletonRows count={4} />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No contacts found"
                description="Try a different search, or clear the department filter."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <ContactCard
                    key={c.id}
                    name={c.name}
                    jobTitle={c.jobTitle}
                    department={c.department}
                    office={c.office}
                    email={c.email}
                    phone={c.phone}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </PageContainer>
    </DashboardShell>
  );
}
