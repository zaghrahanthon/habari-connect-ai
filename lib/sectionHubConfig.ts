import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Building2,
  Calculator,
  FileText,
  GraduationCap,
  Headphones,
  HeartHandshake,
  KeyRound,
  Landmark,
  LifeBuoy,
  Mail,
  Newspaper,
  Radio,
  Shield,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";

export type SectionQuickAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type SectionHubConfig = {
  icon: LucideIcon;
  description: string;
  quickActions: SectionQuickAction[];
  topicHints?: string[];
  askAiPrompt?: string;
};

/**
 * Presentation config for employee section hubs.
 * Content itself still comes from admin Knowledge / Sections / Resources.
 */
export const SECTION_HUB_CONFIG: Record<string, SectionHubConfig> = {
  "it-support": {
    icon: Headphones,
    description:
      "Get help with passwords, software, hardware and technical issues.",
    askAiPrompt: "Help me with IT support at Habari",
    topicHints: [
      "Password & Account Access",
      "Microsoft 365",
      "Wi-Fi & Connectivity",
      "Software & Applications",
      "Hardware",
      "Security",
    ],
    quickActions: [
      {
        id: "reset",
        title: "Reset Password",
        description: "Step-by-step Microsoft password reset",
        href: "#help-articles",
        icon: KeyRound,
      },
      {
        id: "issue",
        title: "Report an Issue",
        description: "Ask Habari AI or contact IT",
        href: "/chat?prompt=I%20need%20to%20report%20an%20IT%20issue",
        icon: LifeBuoy,
      },
      {
        id: "software",
        title: "Software Help",
        description: "Find common software instructions",
        href: "#help-articles",
        icon: Wrench,
      },
      {
        id: "account",
        title: "Account Access",
        description: "Help with Microsoft and company accounts",
        href: "#help-articles",
        icon: KeyRound,
      },
    ],
  },
  hr: {
    icon: HeartHandshake,
    description:
      "Everything you need for leave, benefits and workplace support.",
    askAiPrompt: "Help me with HR questions at Habari",
    topicHints: [
      "Annual Leave",
      "Sick Leave",
      "Maternity Leave",
      "Family Responsibility",
      "Medical Aid",
      "Provident Fund",
    ],
    quickActions: [
      {
        id: "leave",
        title: "Leave Information",
        description: "Annual leave and time off",
        href: "#help-articles",
        icon: FileText,
      },
      {
        id: "handbook",
        title: "Employee Handbook",
        description: "Open company handbook resources",
        href: "/dashboard/resources",
        icon: BookOpen,
      },
      {
        id: "benefits",
        title: "Benefits",
        description: "Medical aid and benefits topics",
        href: "#help-articles",
        icon: HeartHandshake,
      },
      {
        id: "contact",
        title: "Contact HR",
        description: "Find the right HR contact",
        href: "/dashboard/quick-contacts",
        icon: Mail,
      },
    ],
  },
  finance: {
    icon: Landmark,
    description: "Payroll, expenses, claims and financial resources.",
    askAiPrompt: "Help me with Finance questions at Habari",
    topicHints: ["Expense Claims", "Payroll", "Reimbursements", "Invoices"],
    quickActions: [
      {
        id: "expenses",
        title: "Expense Claims",
        description: "How to submit expenses",
        href: "#help-articles",
        icon: Calculator,
      },
      {
        id: "payroll",
        title: "Payroll Information",
        description: "Pay and payroll questions",
        href: "#help-articles",
        icon: Landmark,
      },
      {
        id: "forms",
        title: "Finance Forms",
        description: "Browse related resources",
        href: "#resources",
        icon: FileText,
      },
      {
        id: "contact",
        title: "Contact Finance",
        description: "Find finance contacts",
        href: "/dashboard/quick-contacts",
        icon: Mail,
      },
    ],
  },
  learning: {
    icon: GraduationCap,
    description:
      "Build your skills and continue your professional development.",
    askAiPrompt: "Show me learning and development opportunities at Habari",
    topicHints: ["Courses", "Training", "Mandatory Training", "Onboarding"],
    quickActions: [
      {
        id: "browse",
        title: "Browse Learning",
        description: "Explore learning content",
        href: "#help-articles",
        icon: GraduationCap,
      },
      {
        id: "training",
        title: "Training Resources",
        description: "Documents and materials",
        href: "#resources",
        icon: BookOpen,
      },
      {
        id: "policies",
        title: "Policies",
        description: "Related company policies",
        href: "/dashboard/policies",
        icon: Shield,
      },
      {
        id: "ai",
        title: "Ask Habari AI",
        description: "Find the right course or resource",
        href: "/chat?prompt=Show%20my%20learning%20courses",
        icon: Sparkles,
      },
    ],
  },
  resources: {
    icon: BookOpen,
    description: "Find forms, policies, documents and company tools.",
    askAiPrompt: "Help me find a Habari company resource or document",
    topicHints: [
      "Employee Handbook",
      "HR Forms",
      "Policies",
      "Brand Resources",
      "Templates",
      "IT Resources",
      "Finance",
    ],
    quickActions: [
      {
        id: "handbook",
        title: "Employee Handbook",
        description: "Core company handbook",
        href: "#resources",
        icon: BookOpen,
      },
      {
        id: "forms",
        title: "Forms",
        description: "Company forms and templates",
        href: "#resources",
        icon: FileText,
      },
      {
        id: "policies",
        title: "Policies",
        description: "Open the policies section",
        href: "/dashboard/policies",
        icon: Shield,
      },
      {
        id: "ai",
        title: "Ask Habari AI",
        description: "Find a document quickly",
        href: "/chat?prompt=Help%20me%20find%20a%20company%20document",
        icon: Sparkles,
      },
    ],
  },
  policies: {
    icon: Shield,
    description:
      "Find company policies, procedures and governance information.",
    askAiPrompt: "Help me find a Habari company policy",
    topicHints: [
      "Employment",
      "Leave",
      "Conduct",
      "Social Media",
      "Governance",
      "POPIA",
      "Employment Equity",
      "Disciplinary",
      "Health & Safety",
    ],
    quickActions: [
      {
        id: "search",
        title: "Browse Policies",
        description: "Jump to the policy list",
        href: "#help-articles",
        icon: FileText,
      },
      {
        id: "handbook",
        title: "Employee Handbook",
        description: "Related handbook resources",
        href: "/dashboard/resources",
        icon: BookOpen,
      },
      {
        id: "hr",
        title: "HR Support",
        description: "Open the HR section",
        href: "/dashboard/hr",
        icon: HeartHandshake,
      },
      {
        id: "ai",
        title: "Ask Habari AI",
        description: "Explain a policy in plain language",
        href: "/chat?prompt=Help%20me%20find%20a%20company%20policy",
        icon: Sparkles,
      },
    ],
  },
  about: {
    icon: Building2,
    description: "Learn about Habari Media, our mission and how we work.",
    askAiPrompt: "Tell me about Habari Media",
    quickActions: [
      {
        id: "mission",
        title: "Company Overview",
        description: "Read about Habari",
        href: "#help-articles",
        icon: Building2,
      },
      {
        id: "people",
        title: "People & Culture",
        description: "Meet the team",
        href: "/dashboard/people-culture",
        icon: Users,
      },
      {
        id: "news",
        title: "Latest News",
        description: "What’s happening now",
        href: "/dashboard/news",
        icon: Newspaper,
      },
      {
        id: "ai",
        title: "Ask Habari AI",
        description: "Ask about the company",
        href: "/chat?prompt=Tell%20me%20about%20Habari",
        icon: Sparkles,
      },
    ],
  },
  news: {
    icon: Newspaper,
    description: "The latest from across Habari Media.",
    askAiPrompt: "What's new at Habari?",
    quickActions: [
      {
        id: "latest",
        title: "Latest Updates",
        description: "Jump to the news list",
        href: "#news",
        icon: Newspaper,
      },
      {
        id: "comms",
        title: "Communication Hub",
        description: "Internal announcements",
        href: "/dashboard/communication-hub",
        icon: Radio,
      },
      {
        id: "ai",
        title: "Ask Habari AI",
        description: "Summarise what’s new",
        href: "/chat?prompt=What%27s%20new%20at%20Habari%3F",
        icon: Sparkles,
      },
    ],
  },
  "communication-hub": {
    icon: Radio,
    description: "Important announcements and company communications.",
    askAiPrompt: "What are the latest Habari announcements?",
    quickActions: [
      {
        id: "important",
        title: "Announcements",
        description: "Browse communications",
        href: "#help-articles",
        icon: Radio,
      },
      {
        id: "news",
        title: "News & Updates",
        description: "Company news",
        href: "/dashboard/news",
        icon: Newspaper,
      },
      {
        id: "ai",
        title: "Ask Habari AI",
        description: "Catch up quickly",
        href: "/chat?prompt=What%20are%20the%20latest%20Habari%20announcements%3F",
        icon: Sparkles,
      },
    ],
  },
  marketing: {
    icon: Sparkles,
    description: "Marketing resources and brand information.",
    askAiPrompt: "Help me find Habari marketing resources",
    quickActions: [
      {
        id: "brand",
        title: "Brand Resources",
        description: "Browse marketing content",
        href: "#help-articles",
        icon: Sparkles,
      },
      {
        id: "resources",
        title: "Resources",
        description: "Templates and files",
        href: "/dashboard/resources",
        icon: BookOpen,
      },
      {
        id: "ai",
        title: "Ask Habari AI",
        description: "Find brand guidance",
        href: "/chat?prompt=Help%20me%20find%20Habari%20marketing%20resources",
        icon: Sparkles,
      },
    ],
  },
  general: {
    icon: FileText,
    description: "General company information and useful resources.",
    askAiPrompt: "Help me find general Habari company information",
    quickActions: [
      {
        id: "info",
        title: "Browse Information",
        description: "Jump to articles",
        href: "#help-articles",
        icon: FileText,
      },
      {
        id: "ai",
        title: "Ask Habari AI",
        description: "Find what you need",
        href: "/chat?prompt=Help%20me%20find%20general%20Habari%20information",
        icon: Sparkles,
      },
    ],
  },
};
