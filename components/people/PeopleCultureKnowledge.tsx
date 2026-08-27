import Link from "next/link";
import SectionHeader from "@/components/ui/SectionHeader";
import ResourceRow from "@/components/ui/ResourceRow";
import { KnowledgeBody } from "@/components/ui/KnowledgeBody";
import { Sparkles } from "lucide-react";

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
    <div className="mt-10 space-y-8">
      {sections.length > 0 ? (
        <section>
          <SectionHeader
            title="Culture & community"
            description="Stories and updates from across Habari."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {sections.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                {item.description ? (
                  <p className="mt-2 text-sm text-muted">{item.description}</p>
                ) : null}
                {item.content ? (
                  <div className="mt-3">
                    <KnowledgeBody content={item.content} />
                  </div>
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
          </div>
        </section>
      ) : null}

      {knowledge.length > 0 ? (
        <section>
          <SectionHeader
            title="Culture & information"
            description="Published People & Culture guidance."
          />
          <div className="mx-auto max-w-4xl space-y-4">
            {knowledge.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <div className="mt-3">
                  <KnowledgeBody content={item.content} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {resources.length > 0 ? (
        <section>
          <SectionHeader title="Related resources" />
          <div className="mx-auto max-w-4xl space-y-2">
            {resources.map((item) => (
              <ResourceRow
                key={item.id}
                title={item.title}
                description={item.description}
                fileType={item.fileType}
                href={
                  item.fileUrl
                    ? `/api/resources/${item.id}/download`
                    : "#"
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-5 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">Ask Habari AI</p>
          <p className="mt-1 text-sm text-muted">
            Looking for someone or a culture topic? Ask Habari AI.
          </p>
        </div>
        <Link
          href="/chat?prompt=Help%20me%20find%20someone%20in%20People%20%26%20Culture"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover sm:mt-0"
        >
          <Sparkles className="h-4 w-4" />
          Ask Habari AI
        </Link>
      </div>
    </div>
  );
}
