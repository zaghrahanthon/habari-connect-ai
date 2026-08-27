import { cn } from "@/lib/utils";

/**
 * Split admin knowledge text into readable blocks without changing wording.
 * Detects Option N: / numbered steps / blank-line paragraphs.
 */
export function structureKnowledgeContent(content: string): {
  intro: string[];
  options: { title: string; steps: string[] }[];
  paragraphs: string[];
} {
  const lines = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const options: { title: string; steps: string[] }[] = [];
  const intro: string[] = [];
  const paragraphs: string[] = [];
  let current: { title: string; steps: string[] } | null = null;

  for (const line of lines) {
    const optionMatch = line.match(/^Option\s*\d+\s*[:\-–]\s*(.+)$/i);
    if (optionMatch) {
      if (current) options.push(current);
      current = { title: optionMatch[1].trim(), steps: [] };
      continue;
    }

    const numbered = line.match(/^\d+[\).\]]\s+(.+)$/);
    if (current) {
      current.steps.push(numbered ? numbered[1].trim() : line);
      continue;
    }

    if (numbered) {
      // Collect as a single option-less step list in paragraphs later
      paragraphs.push(line);
      continue;
    }

    if (options.length === 0 && current === null) {
      intro.push(line);
    } else {
      paragraphs.push(line);
    }
  }

  if (current) options.push(current);

  // If we only got numbered lines in paragraphs and no options, convert to steps
  if (options.length === 0) {
    const stepLines = paragraphs.filter((p) => /^\d+[\).\]]\s+/.test(p));
    if (stepLines.length >= 2) {
      options.push({
        title: "Steps",
        steps: stepLines.map((p) => p.replace(/^\d+[\).\]]\s+/, "")),
      });
      return {
        intro,
        options,
        paragraphs: paragraphs.filter((p) => !/^\d+[\).\]]\s+/.test(p)),
      };
    }
  }

  return { intro, options, paragraphs };
}

export function KnowledgeBody({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const structured = structureKnowledgeContent(content);

  if (structured.options.length === 0) {
    return (
      <div className={cn("max-w-3xl space-y-3 text-sm leading-7 text-muted", className)}>
        {content.split(/\n{2,}/).map((block, i) => (
          <p key={i} className="whitespace-pre-wrap">
            {block.trim()}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("max-w-3xl space-y-5", className)}>
      {structured.intro.length > 0 ? (
        <div className="space-y-2 text-sm leading-7 text-muted">
          {structured.intro.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      ) : null}

      {structured.options.map((option) => (
        <div
          key={option.title}
          className="rounded-2xl border border-border bg-background/60 p-4"
        >
          <h4 className="text-sm font-semibold text-foreground">
            {option.title}
          </h4>
          <ol className="mt-3 space-y-2.5">
            {option.steps.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm leading-relaxed text-muted">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent-hover">
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}

      {structured.paragraphs.length > 0 ? (
        <div className="space-y-2 text-sm leading-7 text-muted">
          {structured.paragraphs.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
