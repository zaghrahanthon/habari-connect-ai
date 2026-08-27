"use client";

import { useMemo, useState } from "react";
import { structureKnowledgeContent } from "@/components/ui/KnowledgeBody";
import { cn } from "@/lib/utils";

type PasswordHelpGuideProps = {
  title: string;
  content: string;
};

/**
 * Renders password-reset style knowledge as segmented options + numbered steps.
 * Preserves the original wording from admin content.
 */
export default function PasswordHelpGuide({
  title,
  content,
}: PasswordHelpGuideProps) {
  const structured = useMemo(
    () => structureKnowledgeContent(content),
    [content],
  );
  const [active, setActive] = useState(0);
  const option = structured.options[active] ?? structured.options[0];

  if (structured.options.length < 2) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-hover">
        Help article
      </p>
      <h3 className="mt-1 text-xl font-semibold text-foreground">{title}</h3>
      {structured.intro.length > 0 ? (
        <p className="mt-2 max-w-3xl text-sm text-muted">
          {structured.intro.join(" ")}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">
          Choose the option that applies to you:
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {structured.options.map((opt, index) => (
          <button
            key={opt.title}
            type="button"
            onClick={() => setActive(index)}
            className={cn(
              "rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-colors",
              active === index
                ? "border-accent/40 bg-accent/15 text-accent-hover"
                : "border-border bg-card text-muted hover:text-foreground",
            )}
          >
            {opt.title}
          </button>
        ))}
      </div>

      {option ? (
        <ol className="mt-5 max-w-3xl space-y-3">
          {option.steps.map((step, index) => (
            <li key={index} className="flex gap-3 text-sm leading-7 text-foreground/90">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent-hover">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
