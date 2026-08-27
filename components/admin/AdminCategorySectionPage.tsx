"use client";

import AdminShell from "@/components/admin/AdminShell";
import AdminSectionHeader from "@/components/admin/AdminSectionHeader";
import CategorySectionManager from "@/components/admin/CategorySectionManager";
import { getDashboardSection } from "@/lib/dashboardSections";
import { notFound } from "next/navigation";

type Props = {
  sectionKey: string;
};

export default function AdminCategorySectionPage({ sectionKey }: Props) {
  const section = getDashboardSection(sectionKey);
  if (!section || section.manageMode !== "category") notFound();

  return (
    <AdminShell>
      <div className="mx-auto max-w-5xl space-y-8">
        <AdminSectionHeader
          title={section.title}
          description={section.description}
          employeePath={section.employeePath}
        />
        <CategorySectionManager
          category={section.category}
          sectionTitle={section.title}
        />
      </div>
    </AdminShell>
  );
}
