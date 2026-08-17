import Link from "next/link";

export type PeopleCultureKnowledgeItem = {
  id: string;
  title: string;
  content: string;
};

export type PeopleCultureSectionItem = {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  buttonLabel: string | null;
  buttonUrl: string | null;
};

export type PeopleCultureResourceItem = {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  fileType: string | null;
};

type PeopleCultureKnowledgeProps = {
  knowledge: PeopleCultureKnowledgeItem[];
  sections: PeopleCultureSectionItem[];
  resources: PeopleCultureResourceItem[];
};

export default function PeopleCultureKnowledge({
  knowledge,
  sections,
  resources,
}: PeopleCultureKnowledgeProps) {
  const hasContent =
    knowledge.length > 0 || sections.length > 0 || resources.length > 0;

  if (!hasContent) return null;

  return (
    <div className="mt-14 space-y-10">
      {sections.length > 0 ? (
        <section className="space-y-4">
          {sections.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h2 className="text-lg font-semibold text-foreground">
                {item.title}
              </h2>
              {item.description ? (
                <p className="mt-2 text-sm text-muted">{item.description}</p>
              ) : null}
              {item.content ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {item.content}
                </p>
              ) : null}
              {item.buttonLabel && item.buttonUrl ? (
                <a
                  href={item.buttonUrl}
                  className="mt-4 inline-flex text-sm font-medium text-accent hover:text-accent-hover"
                >
                  {item.buttonLabel} →
                </a>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {knowledge.length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold text-foreground">
            Culture & Information
          </h2>
          <p className="mt-1 text-sm text-muted">
            Published People & Culture knowledge for the Habari team.
          </p>
          <div className="mt-5 space-y-4">
            {knowledge.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                  {item.content}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {resources.length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold text-foreground">Resources</h2>
          <p className="mt-1 text-sm text-muted">
            Useful People & Culture documents and files.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {resources.map((r) => (
              <Link
                key={r.id}
                href={r.fileUrl ? `/api/resources/${r.id}/download` : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent/40"
              >
                <p className="font-medium text-foreground">{r.title}</p>
                {r.description ? (
                  <p className="mt-1 text-xs text-muted">{r.description}</p>
                ) : null}
                {r.fileType ? (
                  <p className="mt-2 text-xs uppercase text-accent">
                    {r.fileType}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
