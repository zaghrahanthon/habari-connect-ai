import { revalidatePath } from "next/cache";
import {
  DASHBOARD_SECTIONS,
  getSectionByCategory,
} from "@/lib/dashboardSections";

/** Revalidate employee (and related admin) paths after content mutations */
export function revalidateEmployeeSection(sectionKey: string) {
  const section = DASHBOARD_SECTIONS.find((s) => s.key === sectionKey);
  if (!section) return;
  revalidatePath(section.employeePath);
  revalidatePath(section.adminPath);
  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");
}

export function revalidateByCategory(category: string) {
  const section = getSectionByCategory(category);
  if (section) {
    revalidateEmployeeSection(section.key);
    return;
  }
  // Fallback: refresh home
  revalidatePath("/dashboard");
}

export function revalidateAllEmployeeSections() {
  for (const section of DASHBOARD_SECTIONS) {
    revalidatePath(section.employeePath);
  }
  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");
}
