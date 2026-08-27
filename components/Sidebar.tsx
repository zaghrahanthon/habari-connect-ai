"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calendar,
  ChartNoAxesCombined,
  DollarSign,
  FolderOpen,
  Headphones,
  Home,
  MessageSquare,
  Newspaper,
  Phone,
  Radio,
  Settings,
  Shield,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

/** Flat list kept for any consumers that map all links */
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "AI Assistant", href: "/chat", icon: Sparkles },
  { label: "My Profile", href: "/profile", icon: User },
  { label: "About Us", href: "/dashboard/about", icon: Users },
  { label: "News & Updates", href: "/dashboard/news", icon: Newspaper },
  { label: "People & Culture", href: "/dashboard/people-culture", icon: Users },
  { label: "Learning", href: "/dashboard/learning", icon: BookOpen },
  { label: "Calendar & Events", href: "/dashboard/calendar", icon: Calendar },
  {
    label: "Analytics & Reports",
    href: "/dashboard/analytics",
    icon: ChartNoAxesCombined,
  },
  { label: "Communication Hub", href: "/dashboard/communication-hub", icon: Radio },
  { label: "Quick Contacts", href: "/dashboard/quick-contacts", icon: Phone },
  { label: "Resources", href: "/dashboard/resources", icon: FolderOpen },
  { label: "IT Support", href: "/dashboard/it-support", icon: Headphones },
  { label: "HR", href: "/dashboard/hr", icon: Users },
  { label: "Policies", href: "/dashboard/policies", icon: Shield },
  { label: "Finance", href: "/dashboard/finance", icon: DollarSign },
  { label: "Settings", href: "/settings", icon: Settings },
];

/** Same links as NAV_ITEMS — grouped visually only (labels & URLs unchanged) */
const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: "Home", href: "/dashboard", icon: Home },
      { label: "AI Assistant", href: "/chat", icon: Sparkles },
      { label: "My Profile", href: "/profile", icon: User },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "About Us", href: "/dashboard/about", icon: Users },
      { label: "News & Updates", href: "/dashboard/news", icon: Newspaper },
      { label: "People & Culture", href: "/dashboard/people-culture", icon: Users },
      { label: "Calendar & Events", href: "/dashboard/calendar", icon: Calendar },
      {
        label: "Communication Hub",
        href: "/dashboard/communication-hub",
        icon: Radio,
      },
    ],
  },
  {
    label: "Work",
    items: [
      { label: "Learning", href: "/dashboard/learning", icon: BookOpen },
      { label: "Resources", href: "/dashboard/resources", icon: FolderOpen },
      {
        label: "Analytics & Reports",
        href: "/dashboard/analytics",
        icon: ChartNoAxesCombined,
      },
      { label: "IT Support", href: "/dashboard/it-support", icon: Headphones },
      { label: "HR", href: "/dashboard/hr", icon: Users },
      { label: "Policies", href: "/dashboard/policies", icon: Shield },
      { label: "Finance", href: "/dashboard/finance", icon: DollarSign },
    ],
  },
  {
    label: "Directory",
    items: [
      { label: "Quick Contacts", href: "/dashboard/quick-contacts", icon: Phone },
    ],
  },
  {
    label: "Account",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
  className?: string;
};

export default function Sidebar({ open = false, onClose, className }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const base = href.split("?")[0];
    if (base === "/dashboard") return pathname === "/dashboard";
    return pathname === base || pathname.startsWith(`${base}/`);
  };

  const navContent = (
    <>
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5"
          onClick={onClose}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20">
            <MessageSquare className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Habari Connect
            </p>
            <p className="text-xs text-muted">AI Platform</p>
          </div>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-card-hover lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 custom-scrollbar">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.label ?? `group-${groupIndex}`}>
            {group.label ? (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/80">
                {group.label}
              </p>
            ) : null}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-accent/15 text-accent-hover"
                        : "text-muted hover:bg-card-hover hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border/60 p-4">
        <p className="text-xs text-muted">Habari Media · Internal use only</p>
      </div>
    </>
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "hidden h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex",
          className,
        )}
      >
        {navContent}
      </aside>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-200 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
