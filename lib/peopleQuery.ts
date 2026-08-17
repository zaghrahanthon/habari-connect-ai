import { prisma } from "@/lib/prisma";
import {
  fullName,
  isEffectivelyNewStarter,
  toPublicPeopleProfile,
  type PublicPeopleProfile,
} from "@/lib/peopleHelpers";

const PEOPLE_QUESTION_RE =
  /\b(who|people|person|staff|team|colleague|colleagues|new starter|new starters|joined|joining|department|office|manager|role|works in|working in|meet)\b/i;

export function isPeopleQuestion(query: string): boolean {
  return PEOPLE_QUESTION_RE.test(query);
}

async function loadPublishedProfiles() {
  const rows = await prisma.peopleProfile.findMany({
    where: { isPublished: true },
    orderBy: [{ displayOrder: "asc" }, { startDate: "desc" }, { lastName: "asc" }],
  });
  return rows.map(toPublicPeopleProfile);
}

export async function getNewStarters(limit = 8): Promise<PublicPeopleProfile[]> {
  const profiles = await loadPublishedProfiles();
  return profiles
    .filter((p) => p.isNewStarter)
    .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))
    .slice(0, limit);
}

export async function searchPeople(search: string): Promise<PublicPeopleProfile[]> {
  const term = search.trim().toLowerCase();
  const profiles = await loadPublishedProfiles();
  if (!term) return profiles;
  return profiles.filter((p) => {
    const haystack = [
      p.fullName,
      p.jobTitle,
      p.department,
      p.office,
      p.shortIntro,
      p.bio,
      p.skills,
      p.interests,
      p.manager,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
}

export async function getPeopleByDepartment(
  department: string,
): Promise<PublicPeopleProfile[]> {
  const profiles = await loadPublishedProfiles();
  return profiles.filter(
    (p) => (p.department ?? "").toLowerCase() === department.toLowerCase(),
  );
}

export async function getPeopleByOffice(
  office: string,
): Promise<PublicPeopleProfile[]> {
  const profiles = await loadPublishedProfiles();
  return profiles.filter(
    (p) => (p.office ?? "").toLowerCase() === office.toLowerCase(),
  );
}

export async function getPersonByName(
  name: string,
): Promise<PublicPeopleProfile[]> {
  const term = name.trim().toLowerCase();
  const profiles = await loadPublishedProfiles();
  return profiles.filter((p) => p.fullName.toLowerCase().includes(term));
}

export function formatPeopleForAi(profiles: PublicPeopleProfile[]): string {
  if (profiles.length === 0) {
    return "No matching published People & Culture profiles were found.";
  }

  return profiles
    .map((p, index) => {
      const lines = [
        `${index + 1}. ${p.fullName}`,
        `Role: ${p.jobTitle}`,
      ];
      if (p.department) lines.push(`Department: ${p.department}`);
      if (p.office) lines.push(`Office: ${p.office}`);
      if (p.startDateLabel) lines.push(`Start date: ${p.startDateLabel}`);
      if (p.isNewStarter) lines.push(`Status: New Starter`);
      if (p.shortIntro) lines.push(`Intro: ${p.shortIntro}`);
      if (p.manager) lines.push(`Manager: ${p.manager}`);
      if (p.skills) lines.push(`Skills: ${p.skills}`);
      if (p.interests) lines.push(`Interests: ${p.interests}`);
      if (p.email) lines.push(`Email: ${p.email}`);
      if (p.phone) lines.push(`Phone: ${p.phone}`);
      // Birthday intentionally omitted from AI context unless product policy changes.
      return lines.join("\n");
    })
    .join("\n\n");
}

export function selectPeopleForAiQuestion(
  profiles: PublicPeopleProfile[],
  question: string,
): PublicPeopleProfile[] {
  const q = question.toLowerCase();

  if (/\b(new starter|new starters|recently joined|who joined|new to habari|welcome)\b/.test(q)) {
    return profiles
      .filter((p) => p.isNewStarter)
      .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""))
      .slice(0, 8);
  }

  const deptMatch = profiles.filter(
    (p) => p.department && q.includes(p.department.toLowerCase()),
  );
  if (deptMatch.length > 0 && /\b(department|team|in)\b/.test(q)) {
    return deptMatch.slice(0, 10);
  }

  const officeMatch = profiles.filter(
    (p) => p.office && q.includes(p.office.toLowerCase()),
  );
  if (officeMatch.length > 0 && /\b(office|cape town|johannesburg|remote)\b/.test(q)) {
    return officeMatch.slice(0, 10);
  }

  const stop = new Set([
    "who",
    "what",
    "is",
    "the",
    "a",
    "an",
    "in",
    "at",
    "for",
    "of",
    "and",
    "our",
    "team",
    "people",
    "person",
    "staff",
    "role",
    "works",
    "working",
    "joined",
    "habari",
    "media",
    "tell",
    "me",
    "about",
  ]);
  const terms = q
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stop.has(t));

  if (terms.length > 0) {
    const matched = profiles.filter((p) => {
      const haystack = [
        p.fullName,
        p.jobTitle,
        p.department,
        p.office,
        p.manager,
        p.skills,
        p.interests,
        p.shortIntro,
        p.bio,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return terms.some((term) => haystack.includes(term));
    });
    if (matched.length > 0) return matched.slice(0, 10);
  }

  return profiles.slice(0, 5);
}

export async function getPeopleContextForChat(question: string): Promise<{
  relevant: boolean;
  context: string;
}> {
  if (!isPeopleQuestion(question)) {
    return { relevant: false, context: "" };
  }

  try {
    const profiles = await loadPublishedProfiles();
    const selected = selectPeopleForAiQuestion(profiles, question);
    return {
      relevant: true,
      context: [
        "## Published People & Culture profiles",
        "Only use these shared intranet profiles. Never invent people or private HR details.",
        "Do not mention birthdays or unpublished profiles.",
        "",
        formatPeopleForAi(selected),
      ].join("\n"),
    };
  } catch (error) {
    console.error("People context for chat failed:", error);
    return {
      relevant: true,
      context: [
        "## People & Culture",
        "People profiles are temporarily unavailable. Do not invent employee details.",
      ].join("\n"),
    };
  }
}

// Keep helpers referenced for clarity in admin tooling / tests
export { fullName, isEffectivelyNewStarter };
