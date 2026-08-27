"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: React.ReactNode;
  className?: string;
};

/** Layout wrapper used by dashboard, chat, profile, and settings pages */
export default function DashboardShell({
  children,
  className,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 text-muted transition-colors hover:bg-card hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Habari Connect
            </p>
            <p className="text-[11px] text-muted">Internal platform</p>
          </div>
        </header>

        <main
          className={cn("flex-1 overflow-y-auto custom-scrollbar", className)}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
