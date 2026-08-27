import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-utils";
import { getAdminDashboardSections } from "@/lib/dashboardSections";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const sections = getAdminDashboardSections();

    const [
      knowledgeGroups,
      sectionGroups,
      resourceGroups,
      newsPublished,
      newsDrafts,
      contactsPublished,
      contactsDrafts,
      peoplePublished,
      peopleDrafts,
      peopleNewStarters,
      analyticsActive,
      analyticsTotal,
      usersCount,
      knowledgeCount,
      resourcesCount,
    ] = await Promise.all([
      prisma.knowledgeItem.groupBy({
        by: ["category", "isPublished"],
        _count: { _all: true },
      }),
      prisma.sectionItem.groupBy({
        by: ["category", "isPublished"],
        _count: { _all: true },
      }),
      prisma.resource.groupBy({
        by: ["category", "isPublished"],
        _count: { _all: true },
      }),
      prisma.newsPost.count({ where: { isPublished: true } }),
      prisma.newsPost.count({ where: { isPublished: false } }),
      prisma.quickContact.count({ where: { isPublished: true } }),
      prisma.quickContact.count({ where: { isPublished: false } }),
      prisma.peopleProfile.count({ where: { isPublished: true } }),
      prisma.peopleProfile.count({ where: { isPublished: false } }),
      prisma.peopleProfile.count({
        where: { isPublished: true, isNewStarter: true },
      }),
      prisma.analyticsProperty.count({ where: { isActive: true } }),
      prisma.analyticsProperty.count(),
      prisma.user.count(),
      prisma.knowledgeItem.count(),
      prisma.resource.count(),
    ]);

    const countFor = (
      groups: { category: string; isPublished: boolean; _count: { _all: number } }[],
      category: string,
      published: boolean,
    ) =>
      groups
        .filter((g) => g.category === category && g.isPublished === published)
        .reduce((sum, g) => sum + g._count._all, 0);

    const sectionStats = sections.map((section) => {
      if (section.manageMode === "news") {
        return {
          key: section.key,
          title: section.title,
          adminPath: section.adminPath,
          description: section.description,
          stats: [
            { label: "published", value: newsPublished },
            { label: "drafts", value: newsDrafts },
          ],
        };
      }
      if (section.manageMode === "contacts") {
        return {
          key: section.key,
          title: section.title,
          adminPath: section.adminPath,
          description: section.description,
          stats: [
            { label: "published", value: contactsPublished },
            { label: "drafts", value: contactsDrafts },
          ],
        };
      }
      if (section.manageMode === "people") {
        return {
          key: section.key,
          title: section.title,
          adminPath: section.adminPath,
          description: section.description,
          stats: [
            { label: "published profiles", value: peoplePublished },
            { label: "drafts", value: peopleDrafts },
            { label: "new starters", value: peopleNewStarters },
          ],
        };
      }
      if (section.manageMode === "calendar") {
        return {
          key: section.key,
          title: section.title,
          adminPath: section.adminPath,
          description: section.description,
          stats: [{ label: "source", value: "Google Sheet" }],
        };
      }
      if (section.manageMode === "analytics") {
        return {
          key: section.key,
          title: section.title,
          adminPath: section.adminPath,
          description: section.description,
          stats: [
            { label: "active properties", value: analyticsActive },
            { label: "total", value: analyticsTotal },
          ],
        };
      }
      if (section.manageMode === "resources") {
        const published =
          countFor(resourceGroups, section.category, true) +
          countFor(resourceGroups, "Resources & Tools", true);
        const drafts =
          countFor(resourceGroups, section.category, false) +
          countFor(resourceGroups, "Resources & Tools", false);
        // Deduplicate if category is Resources & Tools
        const pub = countFor(resourceGroups, "Resources & Tools", true);
        const dr = countFor(resourceGroups, "Resources & Tools", false);
        return {
          key: section.key,
          title: section.title,
          adminPath: section.adminPath,
          description: section.description,
          stats: [
            { label: "published resources", value: pub || published },
            { label: "drafts", value: dr || drafts },
          ],
        };
      }

      // category mode: sum knowledge + sections for that category
      const published =
        countFor(knowledgeGroups, section.category, true) +
        countFor(sectionGroups, section.category, true) +
        countFor(resourceGroups, section.category, true);
      const drafts =
        countFor(knowledgeGroups, section.category, false) +
        countFor(sectionGroups, section.category, false) +
        countFor(resourceGroups, section.category, false);

      return {
        key: section.key,
        title: section.title,
        adminPath: section.adminPath,
        description: section.description,
        stats: [
          { label: "published", value: published },
          { label: "drafts", value: drafts },
        ],
      };
    });

    return NextResponse.json({
      knowledgeCount,
      resourcesCount,
      usersCount,
      newsCount: newsPublished,
      contactsCount: contactsPublished,
      publishedSections: sectionGroups
        .filter((g) => g.isPublished)
        .reduce((s, g) => s + g._count._all, 0),
      sections: sectionStats,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
