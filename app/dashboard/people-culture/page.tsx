import DashboardShell from "@/components/DashboardShell";
import PeopleCultureDirectory from "@/components/people/PeopleCultureDirectory";
import PeopleCultureKnowledge from "@/components/people/PeopleCultureKnowledge";
import { getEmployeeSectionContent } from "@/lib/employee-content";
import { SECTION_ROUTES } from "@/lib/categories";

export default async function PeopleCulturePage() {
  const section = SECTION_ROUTES["people-culture"];
  const { knowledge, sections, resources } = await getEmployeeSectionContent(
    section.category,
  );

  return (
    <DashboardShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            People & Culture
          </h1>
          <p className="mt-3 text-base text-muted">
            Meet the people behind Habari Media.
          </p>
        </header>

        <PeopleCultureDirectory />

        <PeopleCultureKnowledge
          sections={sections.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            content: item.content,
            buttonLabel: item.buttonLabel,
            buttonUrl: item.buttonUrl,
          }))}
          knowledge={knowledge.map((item) => ({
            id: item.id,
            title: item.title,
            content: item.content,
          }))}
          resources={resources.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            fileUrl: item.fileUrl,
            fileType: item.fileType,
          }))}
        />
      </div>
    </DashboardShell>
  );
}
