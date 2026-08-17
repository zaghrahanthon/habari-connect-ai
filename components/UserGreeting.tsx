"use client";

import { getTimeBasedGreeting } from "@/lib/greetings";

type UserGreetingProps = {
  /** Display name — defaults to Sarah for demo until auth is wired up */
  name?: string;
  /** Optional subtitle below the greeting */
  subtitle?: string;
  className?: string;
};

export default function UserGreeting({
  name = "Sarah",
  subtitle,
  className = "",
}: UserGreetingProps) {
  const greeting = getTimeBasedGreeting();

  return (
    <div className={className}>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {greeting}, {name} 👋
      </h1>
      {subtitle && (
        <p className="mt-2 text-base text-muted sm:text-lg">{subtitle}</p>
      )}
    </div>
  );
}
