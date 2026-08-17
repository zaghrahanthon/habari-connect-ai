import DashboardShell from "@/components/DashboardShell";
import { getEmployeeSectionContent } from "@/lib/employee-content";
import { SECTION_ROUTES } from "@/lib/categories";
import { notFound } from "next/navigation";
import Link from "next/link";

type Props = {
  slug: keyof typeof SECTION_ROUTES;
};

export default async function EmployeeSectionPage({ slug }: Props) {
  const section = SECTION_ROUTES[slug];
  if (!section) notFound();

  const { knowledge, sections, resources, news, contacts } =
    await getEmployeeSectionContent(section.category);

  const hasContent =
    knowledge.length > 0 ||
    sections.length > 0 ||
    resources.length > 0 ||
    news.length > 0 ||
    contacts.length > 0;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-accent hover:text-accent-hover">
            ← Back to dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">
            {section.title}
          </h1>
          <p className="mt-2 text-muted">{section.description}</p>
        </div>

        {!hasContent && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-muted">
              No published content yet. Check back soon or ask Habari Connect AI.
            </p>
          </div>
        )}

        {sections.length > 0 && (
          <section className="mb-10 space-y-4">
            {sections.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
                {item.description && (
                  <p className="mt-2 text-sm text-muted">{item.description}</p>
                )}
                {item.content && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {item.content}
                  </p>
                )}
                {item.buttonLabel && item.buttonUrl && (
                  <a
                    href={item.buttonUrl}
                    className="mt-4 inline-flex text-sm font-medium text-accent hover:text-accent-hover"
                  >
                    {item.buttonLabel} →
                  </a>
                )}
              </article>
            ))}
          </section>
        )}

        {knowledge.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
              Information
            </h2>
            <div className="space-y-4">
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
        )}

        {news.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
              News
            </h2>
            <div className="space-y-4">
              {news.map((post) => (
                <article
                  key={post.id}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <h3 className="font-semibold text-foreground">{post.title}</h3>
                  {post.summary && (
                    <p className="mt-2 text-sm text-muted">{post.summary}</p>
                  )}
                  <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">
                    {post.content}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {resources.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
              Resources
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {resources.map((r) => (
                <a
                  key={r.id}
                  href={r.fileUrl ? `/api/resources/${r.id}/download` : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent/40"
                >
                  <p className="font-medium text-foreground">{r.title}</p>
                  {r.description && (
                    <p className="mt-1 text-xs text-muted">{r.description}</p>
                  )}
                  {r.fileType && (
                    <p className="mt-2 text-xs uppercase text-accent">{r.fileType}</p>
                  )}
                </a>
              ))}
            </div>
          </section>
        )}

        {contacts.length > 0 && (
          <section>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">
              Contacts
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <p className="font-medium text-foreground">{c.name}</p>
                  {c.jobTitle && (
                    <p className="text-sm text-muted">{c.jobTitle}</p>
                  )}
                  {c.department && (
                    <p className="text-xs text-muted">{c.department}</p>
                  )}
                  {c.email && (
                    <p className="mt-2 text-sm text-accent">{c.email}</p>
                  )}
                  {c.phone && <p className="text-sm text-muted">{c.phone}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
