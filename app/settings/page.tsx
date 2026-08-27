"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";

export default function SettingsPage() {
  const [userName, setUserName] = useState("Sarah");
  const [notifications, setNotifications] = useState(true);
  const [darkMode] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = localStorage.getItem("habari_user_name");
      if (stored) setUserName(stored);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("habari_user_name", userName);
    // TODO: Persist settings to database when auth is connected
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-2 text-muted">Manage your account and preferences.</p>

        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-medium text-foreground">Profile</h2>
            <div className="mt-4">
              <label
                htmlFor="displayName"
                className="mb-2 block text-sm font-medium text-muted"
              >
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-medium text-foreground">Preferences</h2>
            <div className="mt-4 space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-sm text-muted">Email notifications</span>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="h-4 w-4 rounded accent-accent"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-muted">Dark theme</span>
                <input
                  type="checkbox"
                  checked={darkMode}
                  disabled
                  className="h-4 w-4 rounded accent-accent"
                />
              </label>
              <p className="text-xs text-muted">
                Dark theme is enabled by default for Habari Connect AI.
              </p>
            </div>
          </section>

          <button
            type="submit"
            className="rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Save changes
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}
