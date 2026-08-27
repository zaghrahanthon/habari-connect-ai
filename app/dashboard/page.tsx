"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  ChartNoAxesCombined,
  FolderOpen,
  Headphones,
  Newspaper,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import PromptCards from "@/components/PromptCards";
import UserGreeting from "@/components/UserGreeting";
import UpcomingEventsWidget from "@/components/calendar/UpcomingEventsWidget";
import NewStartersWidget from "@/components/people/NewStartersWidget";
import AnalyticsWidget from "@/components/analytics/AnalyticsWidget";
import PageContainer from "@/components/layout/PageContainer";
import QuickActionCard from "@/components/layout/QuickActionCard";
import SectionCard from "@/components/layout/SectionCard";
import { SectionTitle } from "@/components/layout/SectionCard";
import { PROMPT_CARDS } from "@/lib/prompts";

const HOME_PROMPTS = PROMPT_CARDS.filter((p) =>
  ["calendar", "policies", "hr", "news"].includes(p.id),
).concat([
  {
    id: "people",
    emoji: "👋",
    label: "Who recently joined Habari?",
    prompt: "Who recently joined Habari?",
  },
  {
    id: "analytics",
    emoji: "📊",
    label: "Show website analytics",
    prompt: "How did our websites perform in the last 30 days?",
  },
]);

const QUICK_ACTIONS = [
  {
    href: "/dashboard/calendar",
    title: "Company Calendar",
    description: "Events and important dates",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    href: "/dashboard/people-culture",
    title: "People & Culture",
    description: "Meet the team",
    icon: <Users className="h-5 w-5" />,
  },
  {
    href: "/dashboard/resources",
    title: "Employee Handbook",
    description: "Policies and documents",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    href: "/dashboard/quick-contacts",
    title: "Quick Contacts",
    description: "Find the right person",
    icon: <Phone className="h-5 w-5" />,
  },
  {
    href: "/dashboard/analytics",
    title: "Analytics & Reports",
    description: "Website performance",
    icon: <ChartNoAxesCombined className="h-5 w-5" />,
  },
  {
    href: "/dashboard/news",
    title: "Latest News",
    description: "Company updates",
    icon: <Newspaper className="h-5 w-5" />,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("there");
  const [aiDraft, setAiDraft] = useState("");

  useEffect(() => {
    const boot = window.setTimeout(() => {
      const stored = localStorage.getItem("habari_user_name");
      if (stored) setUserName(stored);
    }, 0);
    return () => window.clearTimeout(boot);
  }, []);

  const goToChat = (prompt?: string) => {
    const q = (prompt ?? aiDraft).trim();
    if (!q) {
      router.push("/chat");
      return;
    }
    router.push(`/chat?prompt=${encodeURIComponent(q)}`);
  };

  return (
    <DashboardShell>
      <PageContainer>
        <UserGreeting
          name={userName}
          subtitle="Welcome to Habari Connect — what would you like to do today?"
        />

        {/* AI first */}
        <SectionCard className="mt-8" padding="lg">
          <div className="flex items-center gap-2 text-accent-hover">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wider">
              Habari AI
            </p>
          </div>
          <p className="mt-2 text-sm text-muted">
            Ask about policies, people, calendar events, or website analytics.
          </p>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              goToChat();
            }}
          >
            <input
              value={aiDraft}
              onChange={(e) => setAiDraft(e.target.value)}
              placeholder="Ask Habari AI…"
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
            />
            <button
              type="submit"
              className="rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Ask AI
            </button>
          </form>
          <div className="mt-5">
            <PromptCards
              prompts={HOME_PROMPTS.slice(0, 4)}
              onSelect={(prompt) => goToChat(prompt)}
            />
          </div>
        </SectionCard>

        {/* Quick actions */}
        <section className="mt-10">
          <SectionTitle
            title="Quick actions"
            description="Jump to the most useful company tools."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard key={action.href} {...action} />
            ))}
          </div>
        </section>

        {/* Happening at Habari */}
        <section className="mt-10">
          <SectionTitle
            title="Happening at Habari"
            description="Upcoming events and new team members."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="min-w-0 [&_section]:mt-0">
              <UpcomingEventsWidget />
            </div>
            <div className="min-w-0 [&_section]:mt-0">
              <NewStartersWidget />
            </div>
          </div>
        </section>

        {/* Resources & tools */}
        <section className="mt-10">
          <SectionTitle
            title="Resources & tools"
            description="Handbooks, policies, learning, and support."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              href="/dashboard/resources"
              title="Resources"
              description="Documents and files"
              icon={<FolderOpen className="h-5 w-5" />}
            />
            <QuickActionCard
              href="/dashboard/policies"
              title="Policies"
              description="Company guidelines"
              icon={<BookOpen className="h-5 w-5" />}
            />
            <QuickActionCard
              href="/dashboard/learning"
              title="Learning"
              description="Courses and training"
              icon={<BookOpen className="h-5 w-5" />}
            />
            <QuickActionCard
              href="/dashboard/it-support"
              title="IT Support"
              description="Help with systems"
              icon={<Headphones className="h-5 w-5" />}
            />
          </div>
        </section>

        {/* Website performance — lazy */}
        <div className="mt-10 [&_section]:mt-0">
          <AnalyticsWidget />
        </div>

        <SectionCard className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">
            Explore Habari Connect
          </h2>
          <p className="mt-2 text-sm text-muted">
            Browse topics from the sidebar, or ask Habari AI for help finding
            what you need.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: "About Us", href: "/dashboard/about" },
              { label: "People & Culture", href: "/dashboard/people-culture" },
              { label: "Learning", href: "/dashboard/learning" },
              { label: "News & Updates", href: "/dashboard/news" },
              { label: "Calendar", href: "/dashboard/calendar" },
              { label: "Quick Contacts", href: "/dashboard/quick-contacts" },
              { label: "Resources", href: "/dashboard/resources" },
            ].map((area) => (
              <a
                key={area.href}
                href={area.href}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent/40 hover:text-foreground"
              >
                {area.label}
              </a>
            ))}
          </div>
        </SectionCard>
      </PageContainer>
    </DashboardShell>
  );
}
