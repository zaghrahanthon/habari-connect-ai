"use client";

import Link from "next/link";
import { getTimeBasedGreeting } from "@/lib/greetings";

/** Landing page — employees enter without login (office network enforced server-side). */
export default function LandingGreeting() {
  const greeting = getTimeBasedGreeting();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-lg">
            ✨
          </div>
          <span className="font-semibold text-foreground">Habari Connect AI</span>
        </div>
        <Link
          href="/admin/login"
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          Admin Login
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-20 pt-10 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">
          {greeting}
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Welcome to Habari Connect
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
          Your AI workplace assistant for news, resources, HR, learning,
          contacts, and everyday tasks — available on the Habari Media office
          network.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-8 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Open Habari Connect
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-8 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
          >
            Admin Login
          </Link>
        </div>

        <div className="mt-20 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              title: "Ask anything",
              desc: "HR, IT, policies, and learning — all in one place.",
            },
            {
              title: "Built for Habari",
              desc: "Tailored for internal teams at Habari Media.",
            },
            {
              title: "Office network access",
              desc: "No employee login — connect on approved office Wi-Fi.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-card p-5 text-left"
            >
              <h3 className="font-medium text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} Habari Media · Internal employee platform
      </footer>
    </div>
  );
}
