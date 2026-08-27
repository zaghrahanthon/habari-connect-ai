"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BookOpen,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Network,
  Settings,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  getAdminDashboardSections,
} from "@/lib/dashboardSections";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const SYSTEM_NAV: NavItem[] = [
  { label: "Knowledge Base", href: "/admin/knowledge", icon: BookOpen },
  { label: "All Content Blocks", href: "/admin/sections", icon: Layers },
  { label: "Users / Admins", href: "/admin/users", icon: Users },
  { label: "Network Access", href: "/admin/network-access", icon: Network },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const active =
    item.href === "/admin/dashboard"
      ? pathname === item.href
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-accent/15 text-accent-hover"
          : "text-muted hover:bg-card-hover hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const contentSections = getAdminDashboardSections().filter(
    (s) => s.adminGroup === "content",
  );
  const dataSections = getAdminDashboardSections().filter(
    (s) => s.adminGroup === "data",
  );

  const nav = (
    <>
      <div className="flex items-center justify-between border-b border-border px-4 py-5">
        <div>
          <p className="text-sm font-semibold text-foreground">Habari Connect</p>
          <p className="text-xs text-muted">Admin Portal</p>
        </div>
        <button
          type="button"
          className="rounded-lg p-2 text-muted hover:bg-card-hover lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        <div className="space-y-1">
          <NavLink
            item={{
              label: "Dashboard",
              href: "/admin/dashboard",
              icon: LayoutDashboard,
            }}
            pathname={pathname}
            onNavigate={() => setOpen(false)}
          />
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-card-hover hover:text-foreground"
          >
            View employee dashboard
          </Link>
        </div>

        <div>
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Content
          </p>
          <div className="space-y-0.5">
            {contentSections.map((section) => (
              <NavLink
                key={section.key}
                item={{
                  label: section.title,
                  href: section.adminPath,
                  icon: section.icon,
                }}
                pathname={pathname}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Data
          </p>
          <div className="space-y-0.5">
            {dataSections.map((section) => (
              <NavLink
                key={section.key}
                item={{
                  label: section.title,
                  href: section.adminPath,
                  icon: section.icon,
                }}
                pathname={pathname}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            System
          </p>
          <div className="space-y-0.5">
            {SYSTEM_NAV.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>
        </div>
      </nav>
      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-card-hover hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        {nav}
      </aside>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {nav}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 lg:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:bg-card lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-muted">
            Manage Habari Connect
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
