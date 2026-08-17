"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import PromptCards from "@/components/PromptCards";
import UserGreeting from "@/components/UserGreeting";
import UpcomingEventsWidget from "@/components/calendar/UpcomingEventsWidget";
import NewStartersWidget from "@/components/people/NewStartersWidget";
import { PROMPT_CARDS } from "@/lib/prompts";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("Sarah");

  useEffect(() => {
    const stored = localStorage.getItem("habari_user_name");
    if (stored) setUserName(stored);
  }, []);

  const handlePromptSelect = (prompt: string) => {
    router.push(`/chat?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <UserGreeting
          name={userName}
          subtitle="What would you like to work on today?"
        />

        <section className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-muted sm:text-[15px]">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Welcome to HM Connect
          </h2>
          <p className="font-medium text-foreground/90">
            Welcome to HM Connect – Your New Home away from Home!
          </p>
          <p>
            Whether you’re a seasoned Habari Media veteran who still remembers
            where the good biscuits are hidden, or a bright-eyed newcomer trying
            to figure out which mug is safe to use in the kitchen – welcome!
          </p>
          <p>
            You’ve just landed on HM Connect, your one-stop digital home for
            everything Habari Media. Think of it as the colleague who knows
            things: where to find that template you desperately need at 4:55 PM
            on a Friday, who to call in an emergency, what’s happening at the
            next company event, and yes, even how to spell “Habari” correctly
            when you’re half a coffee in. We’ve put it all here, just for you.
          </p>
          <p>
            Gone are the days of frantically emailing three different people to
            track down a brand guideline or hunting through a maze of shared
            drives like you’re on some sort of corporate treasure hunt. HM
            Connect is your central hub for company news, learning and
            development resources, internal communications, tools, templates,
            and so much more.
          </p>
          <p>
            We’re a team built on creativity, passion, and world-class
            storytelling – and now we finally have an intranet worthy of that
            reputation. So go ahead, have a click around, make yourself at home.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
            Quick prompts
          </h2>
          <PromptCards prompts={PROMPT_CARDS} onSelect={handlePromptSelect} />
        </section>

        <UpcomingEventsWidget />
        <NewStartersWidget />

        <section className="mt-12 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Company knowledge areas
          </h2>
          <p className="mt-2 text-sm text-muted">
            Browse topics through the sidebar or ask the AI assistant directly.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "About Us",
              "People & Culture",
              "Learning",
              "News & Updates",
              "Calendar",
              "Quick Contacts",
              "Resources",
            ].map((area) => (
              <span
                key={area}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted"
              >
                {area}
              </span>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
