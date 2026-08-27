import DashboardShell from "@/components/DashboardShell";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import SectionCard from "@/components/layout/SectionCard";
import EmptyState from "@/components/layout/EmptyState";
import SectionHeader from "@/components/ui/SectionHeader";
import QuickActionGrid from "@/components/ui/QuickActionGrid";
import { TopicChipRow } from "@/components/ui/TopicChips";
import ResourceRow from "@/components/ui/ResourceRow";
import ArticleCard from "@/components/ui/ArticleCard";
import { KnowledgeBody } from "@/components/ui/KnowledgeBody";
import PasswordHelpGuide from "@/components/ui/PasswordHelpGuide";
import { getEmployeeSectionContent } from "@/lib/employee-content";
import { SECTION_ROUTES } from "@/lib/categories";
import { SECTION_HUB_CONFIG } from "@/lib/sectionHubConfig";
import { structureKnowledgeContent } from "@/components/ui/KnowledgeBody";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";

type Props = {
  slug: keyof typeof SECTION_ROUTES;
};

function isPasswordStyleArticle(title: string, content: string) {
  const structured = structureKnowledgeContent(content);
  return (
    /password/i.test(title) &&
    structured.options.length >= 2
  );
}

export default async function EmployeeSectionPage({ slug }: Props) {
  const section = SECTION_ROUTES[slug];
  if (!section) notFound();

  const hub = SECTION_HUB_CONFIG[slug] ?? SECTION_HUB_CONFIG.general;
  const Icon = hub.icon;

  const { knowledge, sections, resources, news, contacts } =
    await getEmployeeSectionContent(section.category);

  const passwordArticles = knowledge.filter((item) =>
    isPasswordStyleArticle(item.title, item.content),
  );
  const passwordIds = new Set(passwordArticles.map((item) => item.id));
  const otherKnowledge = knowledge.filter((item) => !passwordIds.has(item.id));

  const isNewsHub = slug === "news";
  const isCommsHub = slug === "communication-hub";
  const isPolicies = slug === "policies";
  const isResources = slug === "resources";

  const featuredNews = isNewsHub && news.length > 0 ? news[0] : null;
  const remainingNews =
    isNewsHub && featuredNews
      ? news.slice(1)
      : isNewsHub
        ? news
        : [];

  const importantComms =
    isCommsHub && (sections[0] || knowledge[0])
      ? sections[0] ?? null
      : null;

  const hasContent =
    knowledge.length > 0 ||
    sections.length > 0 ||
    resources.length > 0 ||
    news.length > 0 ||
    contacts.length > 0;

  const askHref = hub.askAiPrompt
    ? `/chat?prompt=${encodeURIComponent(hub.askAiPrompt)}`
    : "/chat";

  return (
    <DashboardShell>
      <PageContainer>
        <PageHeader
          title={section.title}
          description={hub.description || section.description}
          icon={<Icon className="h-5 w-5" />}
          actions={
            <Link
              href={askHref}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/35 hover:bg-card-hover"
            >
              <Sparkles className="h-4 w-4 text-accent-hover" />
              Ask Habari AI
            </Link>
          }
        />

        <div className="mt-8 space-y-8">
          {hub.quickActions.length > 0 ? (
            <section>
              <SectionHeader title="Quick Help" />
              <QuickActionGrid actions={hub.quickActions} />
            </section>
          ) : null}

          {hub.topicHints && hub.topicHints.length > 0 ? (
            <section>
              <SectionHeader
                title={
                  isPolicies
                    ? "Policy categories"
                    : isResources
                      ? "Browse by category"
                      : "Popular topics"
                }
              />
              <TopicChipRow labels={hub.topicHints} />
            </section>
          ) : null}

          {passwordArticles.map((item) => (
            <PasswordHelpGuide
              key={item.id}
              title={item.title}
              content={item.content}
            />
          ))}

          {importantComms ? (
            <section>
              <SectionHeader title="Important" />
              <ArticleCard
                title={importantComms.title}
                summary={importantComms.description}
                category="Announcement"
                featured
              >
                {importantComms.content ? (
                  <div className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                    <KnowledgeBody content={importantComms.content} />
                  </div>
                ) : null}
                {importantComms.buttonLabel && importantComms.buttonUrl ? (
                  <a
                    href={importantComms.buttonUrl}
                    className="mt-4 inline-flex text-sm font-medium text-accent hover:text-accent-hover"
                  >
                    {importantComms.buttonLabel} →
                  </a>
                ) : null}
              </ArticleCard>
            </section>
          ) : null}

          {sections.length > 0 && !(isCommsHub && importantComms) ? (
            <section>
              <SectionHeader
                title={
                  slug === "about"
                    ? "About Habari"
                    : slug === "learning"
                      ? "Featured learning"
                      : "Highlighted information"
                }
              />
              <div className="grid gap-4 lg:grid-cols-2">
                {sections.map((item) => (
                  <SectionCard key={item.id} className="h-full">
                    <h3 className="text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    {item.description ? (
                      <p className="mt-2 text-sm text-muted">
                        {item.description}
                      </p>
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
                  </SectionCard>
                ))}
              </div>
            </section>
          ) : null}

          {isCommsHub && sections.length > 1 ? (
            <section>
              <SectionHeader title="Latest announcements" />
              <div className="grid gap-4 lg:grid-cols-2">
                {sections.slice(1).map((item) => (
                  <ArticleCard
                    key={item.id}
                    title={item.title}
                    summary={item.description ?? item.content?.slice(0, 160)}
                    category="Update"
                  />
                ))}
              </div>
            </section>
          ) : null}

          {featuredNews ? (
            <section id="news">
              <SectionHeader title="Featured story" />
              <ArticleCard
                title={featuredNews.title}
                summary={featuredNews.summary}
                category={featuredNews.category}
                featured
              >
                <p className="mt-3 max-w-3xl line-clamp-6 whitespace-pre-wrap text-sm leading-7 text-muted">
                  {featuredNews.content}
                </p>
              </ArticleCard>
            </section>
          ) : null}

          {(remainingNews.length > 0 || (!isNewsHub && news.length > 0)) && (
            <section id={isNewsHub ? undefined : "news"}>
              <SectionHeader
                title={isNewsHub ? "Latest news" : "Latest updates"}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {(isNewsHub ? remainingNews : news).map((post) => (
                  <ArticleCard
                    key={post.id}
                    title={post.title}
                    summary={post.summary}
                    category={post.category}
                  >
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-muted">
                      {post.content}
                    </p>
                  </ArticleCard>
                ))}
              </div>
            </section>
          )}

          {otherKnowledge.length > 0 ? (
            <section id="help-articles">
              <SectionHeader
                title={
                  isPolicies
                    ? "All policies"
                    : slug === "learning"
                      ? "All learning resources"
                      : slug === "finance"
                        ? "Common tasks & information"
                        : "Help articles"
                }
                description={
                  isPolicies
                    ? "Company policies, procedures and governance information."
                    : undefined
                }
              />

              {isPolicies || isResources ? (
                <div className="mx-auto max-w-4xl space-y-3">
                  {otherKnowledge.map((item) => (
                    <details
                      key={item.id}
                      className="group rounded-2xl border border-border bg-card open:border-accent/25"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            Updated{" "}
                            {new Date(item.updatedAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-accent">
                          View →
                        </span>
                      </summary>
                      <div className="border-t border-border px-4 py-4">
                        <KnowledgeBody content={item.content} />
                        <Link
                          href={`/chat?prompt=${encodeURIComponent(`Explain the ${item.title} policy in plain language`)}`}
                          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Ask Habari AI about this
                        </Link>
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-12">
                  <div className="space-y-4 lg:col-span-8">
                    {otherKnowledge.map((item) => (
                      <SectionCard key={item.id}>
                        <h3 className="text-lg font-semibold text-foreground">
                          {item.title}
                        </h3>
                        <div className="mt-3">
                          <KnowledgeBody content={item.content} />
                        </div>
                      </SectionCard>
                    ))}
                  </div>
                  <aside className="space-y-4 lg:col-span-4">
                    <SectionCard padding="sm" className="sticky top-6">
                      <p className="text-sm font-semibold text-foreground">
                        Need more help?
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        Still stuck? Ask Habari AI or browse related contacts
                        and resources.
                      </p>
                      <div className="mt-4 flex flex-col gap-2">
                        <Link
                          href={askHref}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                        >
                          <Sparkles className="h-4 w-4" />
                          Contact via AI
                        </Link>
                        <Link
                          href="/dashboard/quick-contacts"
                          className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
                        >
                          Quick Contacts
                        </Link>
                        <Link
                          href="/dashboard/resources"
                          className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
                        >
                          Resources
                        </Link>
                      </div>
                    </SectionCard>
                  </aside>
                </div>
              )}
            </section>
          ) : null}

          {resources.length > 0 ? (
            <section id="resources">
              <SectionHeader
                title={isResources ? "All resources" : "Related resources"}
                description={
                  isResources
                    ? "Forms, documents and tools managed by Habari admins."
                    : undefined
                }
              />
              <div className="mx-auto max-w-4xl space-y-2">
                {resources.map((r) => (
                  <ResourceRow
                    key={r.id}
                    title={r.title}
                    description={r.description}
                    category={r.category}
                    fileType={r.fileType}
                    href={
                      r.fileUrl ? `/api/resources/${r.id}/download` : "#"
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}

          {contacts.length > 0 ? (
            <section>
              <SectionHeader title="Contacts" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {contacts.map((c) => (
                  <SectionCard key={c.id} padding="sm">
                    <p className="font-medium text-foreground">{c.name}</p>
                    {c.jobTitle ? (
                      <p className="text-sm text-muted">{c.jobTitle}</p>
                    ) : null}
                    {c.department ? (
                      <p className="text-xs text-muted">{c.department}</p>
                    ) : null}
                    {c.email ? (
                      <a
                        href={`mailto:${c.email}`}
                        className="mt-2 block text-sm text-accent hover:text-accent-hover"
                      >
                        {c.email}
                      </a>
                    ) : null}
                    {c.phone ? (
                      <a
                        href={`tel:${c.phone}`}
                        className="block text-sm text-muted hover:text-foreground"
                      >
                        {c.phone}
                      </a>
                    ) : null}
                  </SectionCard>
                ))}
              </div>
            </section>
          ) : null}

          {!hasContent ? (
            <EmptyState
              title={`No ${section.title.toLowerCase()} content yet`}
              description="Content added by administrators will appear here. Meanwhile, ask Habari AI for help."
            />
          ) : null}

          {hasContent &&
          !(isPolicies || isResources || isNewsHub) &&
          (passwordArticles.length > 0 || otherKnowledge.length === 0) ? (
            <section>
              <div className="rounded-2xl border border-border bg-card p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
                <div>
                  <p className="font-semibold text-foreground">Need more help?</p>
                  <p className="mt-1 text-sm text-muted">
                    Still having trouble? Ask Habari AI about{" "}
                    {section.title.toLowerCase()}.
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
                  <Link
                    href={askHref}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
                  >
                    <Sparkles className="h-4 w-4" />
                    Ask Habari AI
                  </Link>
                  <Link
                    href="/dashboard/quick-contacts"
                    className="inline-flex items-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card-hover"
                  >
                    Quick Contacts
                  </Link>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </PageContainer>
    </DashboardShell>
  );
}
