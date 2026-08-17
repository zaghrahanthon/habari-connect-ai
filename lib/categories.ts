/** Knowledge categories — safe for client and server components */
export const KNOWLEDGE_CATEGORIES = [
  "About Us",
  "People & Culture",
  "Learning & Development",
  "News & Updates",
  "Communication Hub",
  "Calendar & Events",
  "Quick Contacts",
  "Resources & Tools",
  "Policies",
  "HR",
  "IT Support",
  "Finance",
  "Marketing",
  "General",
] as const;

/** Maps employee dashboard routes to content categories */
export const SECTION_ROUTES: Record<
  string,
  { title: string; category: string; description: string }
> = {
  about: {
    title: "About Us",
    category: "About Us",
    description: "Learn about Habari Media and our mission.",
  },
  "people-culture": {
    title: "People & Culture",
    category: "People & Culture",
    description: "Culture, values, and life at Habari Media.",
  },
  learning: {
    title: "Learning & Development",
    category: "Learning & Development",
    description: "Courses, training, and growth opportunities.",
  },
  news: {
    title: "News & Updates",
    category: "News & Updates",
    description: "Latest company news and announcements.",
  },
  "communication-hub": {
    title: "Communication Hub",
    category: "Communication Hub",
    description: "Internal communications and updates.",
  },
  calendar: {
    title: "Calendar & Events",
    category: "Calendar & Events",
    description: "Upcoming events and company calendar.",
  },
  "quick-contacts": {
    title: "Quick Contacts",
    category: "Quick Contacts",
    description: "Find the right person to contact.",
  },
  resources: {
    title: "Resources & Tools",
    category: "Resources & Tools",
    description: "Templates, documents, and internal tools.",
  },
  "it-support": {
    title: "IT Support",
    category: "IT Support",
    description: "IT helpdesk, passwords, software, and technical support.",
  },
  hr: {
    title: "HR",
    category: "HR",
    description: "Human resources, leave, payroll, and employee services.",
  },
  policies: {
    title: "Policies",
    category: "Policies",
    description: "Company policies, procedures, and guidelines.",
  },
  finance: {
    title: "Finance",
    category: "Finance",
    description: "Expenses, reimbursements, and finance processes.",
  },
  marketing: {
    title: "Marketing",
    category: "Marketing",
    description: "Marketing resources and brand information.",
  },
  general: {
    title: "General",
    category: "General",
    description: "General company information.",
  },
};
