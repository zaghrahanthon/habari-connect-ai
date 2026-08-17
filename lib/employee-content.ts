import { prisma } from "@/lib/prisma";

const emptyContent = {
  knowledge: [] as Awaited<ReturnType<typeof fetchKnowledge>>,
  sections: [] as Awaited<ReturnType<typeof fetchSections>>,
  resources: [] as Awaited<ReturnType<typeof fetchResources>>,
  news: [] as Awaited<ReturnType<typeof fetchNews>>,
  contacts: [] as Awaited<ReturnType<typeof fetchContacts>>,
};

async function fetchKnowledge(category: string) {
  return prisma.knowledgeItem.findMany({
    where: { category, isPublished: true, isEmployeeVisible: true },
    orderBy: { updatedAt: "desc" },
  });
}

async function fetchSections(category: string) {
  return prisma.sectionItem.findMany({
    where: { category, isPublished: true },
    orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
  });
}

async function fetchResources(category: string) {
  return prisma.resource.findMany({
    where: { category, isPublished: true, isEmployeeVisible: true },
    orderBy: { updatedAt: "desc" },
  });
}

async function fetchNews() {
  return prisma.newsPost.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
  });
}

async function fetchContacts() {
  return prisma.quickContact.findMany({
    where: { isPublished: true },
    orderBy: { name: "asc" },
  });
}

/** Fetch published employee-visible content for a section category */
export async function getEmployeeSectionContent(category: string) {
  try {
    const [knowledge, sections, resources, news, contacts] = await Promise.all([
      fetchKnowledge(category),
      fetchSections(category),
      fetchResources(category),
      category === "News & Updates" ? fetchNews() : Promise.resolve([]),
      category === "Quick Contacts" ? fetchContacts() : Promise.resolve([]),
    ]);

    return { knowledge, sections, resources, news, contacts };
  } catch (error) {
    console.error("getEmployeeSectionContent error:", error);
    // Return empty lists if DB tables are missing — run: npm run db:migrate
    return emptyContent;
  }
}

export async function searchPublishedContacts(query: string) {
  try {
    const term = query.trim();
    if (!term) {
      return fetchContacts();
    }

    return prisma.quickContact.findMany({
      where: {
        isPublished: true,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { jobTitle: { contains: term, mode: "insensitive" } },
          { department: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("searchPublishedContacts error:", error);
    return [];
  }
}
