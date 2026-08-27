import DashboardShell from "@/components/DashboardShell";
import PeopleCultureDirectory from "@/components/people/PeopleCultureDirectory";
import PeopleCultureKnowledge from "@/components/people/PeopleCultureKnowledge";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { getEmployeeSectionContent } from "@/lib/employee-content";
import { SECTION_ROUTES } from "@/lib/categories";
import { Users } from "lucide-react";

export default async function PeopleCulturePage() {
  const section = SECTION_ROUTES["people-culture"];
  const { knowledge, sections, resources } = await getEmployeeSectionContent(
    section.category,
  );

  return (
    <DashboardShell>
      <PageContainer wide>
        <PageHeader
          title="People & Culture"
          description="Meet the people behind Habari Media."
          icon={<Users className="h-5 w-5" />}
        />

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
      </PageContainer>
    </DashboardShell>
  );
}
