import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Building2,
  Calendar,
  ChartNoAxesCombined,
  DollarSign,
  FolderOpen,
  Headphones,
  HeartHandshake,
  Newspaper,
  Phone,
  Radio,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

/**
 * How admin content maps to employee pages.
 * specialised = dedicated model/UI
 * category = KnowledgeItem + SectionItem + Resource filtered by category
 */
export type SectionManageMode =
  | "category"
  | "people"
  | "news"
  | "contacts"
  | "calendar"
  | "analytics"
  | "resources";

export type DashboardSection = {
  key: string;
  title: string;
  /** Prisma category string for Knowledge / Sections / Resources */
  category: string;
  description: string;
  employeePath: string;
  adminPath: string;
  icon: LucideIcon;
  manageMode: SectionManageMode;
  /** Show in employee sidebar */
  employeeNav?: boolean;
  /** Show on admin dashboard control centre */
  adminDashboard?: boolean;
  /** Admin sidebar group */
  adminGroup: "content" | "data" | "system";
};

/**
 * Single source of truth for employee ↔ admin section pairing.
 */
export const DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    key: "about",
    title: "About Us",
    category: "About Us",
    description: "Learn about Habari Media, our mission and how we work.",
    employeePath: "/dashboard/about",
    adminPath: "/admin/about",
    icon: Building2,
    manageMode: "category",
    employeeNav: true,
    adminDashboard: true,
    adminGroup: "content",
  },
  {
    key: "news",
    title: "News & Updates",
    category: "News & Updates",
    description: "The latest from across Habari Media.",
    employeePath: "/dashboard/news",
    adminPath: "/admin/news",
    icon: Newspaper,
    manageMode: "news",
    employeeNav: true,
    adminDashboard: true,
    adminGroup: "content",
  },
  {
    key: "people-culture",
    title: "People & Culture",
    category: "People & Culture",
    description: "Meet the people behind Habari Media.",
    employeePath: "/dashboard/people-culture",
    adminPath: "/admin/people-culture",
    icon: Users,
    manageMode: "people",
    employeeNav: true,
    adminDashboard: true,
    adminGroup: "content",
  },
  {
    key: "calendar",
    title: "Calendar & Events",
    category: "Calendar & Events",
    description: "See what's happening across Habari.",
    employeePath: "/dashboard/calendar",
    adminPath: "/admin/calendar",
    icon: Calendar,
    manageMode: "calendar",
    employeeNav: true,
    adminDashboard: true,
    adminGroup: "content",
  },
  {
    key: "communication-hub",
    title: "Communication Hub",
    category: "Communication Hub",
    description: "Important announcements and company communications.",
    employeePath: "/dashboard/communication-hub",
    adminPath: "/admin/communication-hub",
    icon: Radio,
    manageMode: "category",
    employeeNav: true,
    adminDashboard: true,
    adminGroup: "content",
  },
  {
    key: "learning",
    title: "Learning & Development",
    category: "Learning & Development",
    description:
      "Build your skills and continue your professional development.",
    employeePath: "/dashboard/learning",
    adminPath: "/admin/learning",
    icon: BookOpen,
    manageMode: "category",
    employeeNav: true,
    adminDashboard: true,
    adminGroup: "content",
  },
  {
    key: "resources",
    title: "Resources",
    category: "Resources & Tools",
    description: "Find forms, policies, documents and company tools.",
    employeePath: "/dashboard/resources",
    adminPath: "/admin/resources",
    icon: FolderOpen,
    manageMode: "resources",
    employeeNav: true,
    adminDashboard: true,
    adminGroup: "content",
  },
  {
    key: "analytics",
    title: "Analytics & Reports",
    category: "Analytics & Reports",
    description: "Explore website performance and create reports.",
    employeePath: "/dashboard/analytics",
    adminPath: "/admin/analytics",
    icon: ChartNoAxesCombined,
    manageMode: "analytics",
    employeeNav: true,
    adminDashboard: true,
    adminGroup: "data",
  },
  {
    key: "it-support",
    title: "IT Support",
    category: "IT Support",
    description:
      "Get help with passwords, software, hardware and technical issues.",
    employeePath: "/dashboard/it-support",
    adminPath: "/admin/it-support",
    icon: Headphones,
    manageMode: "category",
    employeeNav: true,
    adminDashboard: true,
    adminGroup: "content",
  },
  {
    key: "hr",
    title: "HR",
    category: "HR",
    description:
      "Everything you need for leave, benefits and workplace support.",
    employeePath: "/dashboard/hr",
    adminPath: "/admin/hr",
    icon: HeartHandshake,
    manageMode: "category",
    employeeNav: true,
    adminDashboard: true,
    adminGroup: "content",
  },
  {
    key: "policies",
    title: "Policies",
    category: "Policies",
    description:
      "Find company policies, procedures and governance information.",
    employeePath: "/dashboard/policies",
    adminPath: "/admin/policies",
    icon: Shield,
    manageMode: "category",
    employeeNav: true,
    adminDashboard: true,
    adminGroup: "content",
  },
  {
    key: "finance",
    title: "Finance",
    category: "Finance",
    description: "Payroll, expenses, claims and financial resources.",
    employeePath: "/dashboard/finance",
    adminPath: "/admin/finance",
    icon: DollarSign,
    manageMode: "category",
    employeeNav: true,
    adminDashboard: true,
    adminGroup: "content",
  },
  {
    key: "quick-contacts",
    title: "Quick Contacts",
    category: "Quick Contacts",
    description: "Find the right person quickly.",
    employeePath: "/dashboard/quick-contacts",
    adminPath: "/admin/quick-contacts",
    icon: Phone,
    manageMode: "contacts",
    employeeNav: true,
    adminDashboard: true,
    adminGroup: "content",
  },
  {
    key: "marketing",
    title: "Marketing",
    category: "Marketing",
    description: "Marketing resources and brand information.",
    employeePath: "/dashboard/marketing",
    adminPath: "/admin/marketing",
    icon: Sparkles,
    manageMode: "category",
    employeeNav: false,
    adminDashboard: false,
    adminGroup: "content",
  },
  {
    key: "general",
    title: "General",
    category: "General",
    description: "General company information and useful resources.",
    employeePath: "/dashboard/general",
    adminPath: "/admin/general",
    icon: FolderOpen,
    manageMode: "category",
    employeeNav: false,
    adminDashboard: false,
    adminGroup: "content",
  },
];

export function getDashboardSection(
  key: string,
): DashboardSection | undefined {
  return DASHBOARD_SECTIONS.find((s) => s.key === key);
}

export function getSectionByCategory(
  category: string,
): DashboardSection | undefined {
  return DASHBOARD_SECTIONS.find((s) => s.category === category);
}

export function getAdminDashboardSections(): DashboardSection[] {
  return DASHBOARD_SECTIONS.filter((s) => s.adminDashboard !== false);
}

export function getEmployeeNavSections(): DashboardSection[] {
  return DASHBOARD_SECTIONS.filter((s) => s.employeeNav !== false);
}

/** Categories used by Knowledge / Sections / Resources forms */
export const KNOWLEDGE_CATEGORIES = [
  "About Us",
  "People & Culture",
  "Learning & Development",
  "News & Updates",
  "Communication Hub",
  "Quick Contacts",
  "Resources & Tools",
  "Policies",
  "HR",
  "IT Support",
  "Finance",
  "Marketing",
  "General",
] as const;

/** Compatibility map used by EmployeeSectionPage */
export const SECTION_ROUTES: Record<
  string,
  { title: string; category: string; description: string }
> = Object.fromEntries(
  DASHBOARD_SECTIONS.filter((s) => s.manageMode !== "analytics").map((s) => [
    s.key,
    { title: s.title, category: s.category, description: s.description },
  ]),
);
