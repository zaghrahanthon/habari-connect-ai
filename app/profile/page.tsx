"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Phone, User } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import UserGreeting from "@/components/UserGreeting";

export default function ProfilePage() {
  const [userName, setUserName] = useState("Sarah");

  useEffect(() => {
    const stored = localStorage.getItem("habari_user_name");
    if (stored) setUserName(stored);
  }, []);

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <UserGreeting name={userName} subtitle="Your employee profile" />

        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
              <User className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {userName} Employee
              </h2>
              <p className="text-sm text-muted">Role: Employee</p>
            </div>
          </div>

          <div className="mt-6 space-y-4 border-t border-border pt-6">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted" />
              <span className="text-muted">sarah.employee@habarimedia.com</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted" />
              <span className="text-muted">+27 00 000 0000</span>
            </div>
          </div>

          {/* TODO: Load real user data from database after authentication is implemented */}
          <p className="mt-6 text-xs text-muted">
            Profile data is placeholder until database authentication is connected.
          </p>
        </div>

        <div className="mt-6">
          <Link
            href="/settings"
            className="text-sm font-medium text-accent hover:text-accent-hover"
          >
            Edit settings →
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
