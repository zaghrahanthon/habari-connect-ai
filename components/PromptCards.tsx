"use client";

import { type PromptCard } from "@/lib/prompts";
import { cn } from "@/lib/utils";

type PromptCardsProps = {
  prompts: PromptCard[];
  onSelect: (prompt: string) => void;
  className?: string;
};

export default function PromptCards({
  prompts,
  onSelect,
  className,
}: PromptCardsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {prompts.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => onSelect(card.prompt)}
          className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-accent/40 hover:bg-card-hover"
        >
          <span className="text-xl" aria-hidden>
            {card.emoji}
          </span>
          <span className="text-sm font-medium leading-snug text-foreground group-hover:text-accent-hover">
            {card.label}
          </span>
        </button>
      ))}
    </div>
  );
}
