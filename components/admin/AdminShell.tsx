"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BookOpen,
  Calendar,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Network,
  Phone,
  Settings,
  Upload,
  Users,
  X,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Knowledge", href: "/admin/knowledge", icon: BookOpen },
  { label: "Sections", href: "/admin/sections", icon: Layers },
  { label: "Resources", href: "/admin/resources", icon: Upload },
  { label: "News", href: "/admin/news", icon: Newspaper },
  { label: "Contacts", href: "/admin/contacts", icon: Phone },
  { label: "People & Culture", href: "/admin/people-culture", icon: HeartHandshake },
  { label: "Calendar", href: "/admin/calendar", icon: Calendar },
  { label: "Network Access", href: "/admin/network-access", icon: Network },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent/15 text-accent-hover"
                  : "text-muted hover:bg-card-hover hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
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
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />
      )}
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
          <span className="text-sm font-medium text-muted">Administration</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
