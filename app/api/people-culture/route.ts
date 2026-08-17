import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { toPublicPeopleProfile } from "@/lib/peopleHelpers";
import { handleApiError, jsonError } from "@/lib/api-utils";

export async function GET(request: Request) {
  const office = await requireOfficeNetwork("/api/people-culture");
  if (office.error) return office.error;

  try {
    if (typeof prisma.peopleProfile?.findMany !== "function") {
      return jsonError(
        "Database client is outdated. Stop the app and run: npx prisma generate && npm run dev",
        500,
      );
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const department = searchParams.get("department") ?? "";
    const officeFilter = searchParams.get("office") ?? "";
    const newStarterOnly = searchParams.get("newStarter") === "true";
    const limitRaw = Number(searchParams.get("limit") ?? "0");
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(limitRaw, 100)
        : 0;

    const rows = await prisma.peopleProfile.findMany({
      where: { isPublished: true },
      orderBy: [
        { displayOrder: "asc" },
        { startDate: "desc" },
        { lastName: "asc" },
      ],
    });

    let profiles = rows.map(toPublicPeopleProfile);

    if (newStarterOnly) {
      profiles = profiles.filter((p) => p.isNewStarter);
    }
    if (department) {
      profiles = profiles.filter((p) => (p.department ?? "") === department);
    }
    if (officeFilter) {
      profiles = profiles.filter((p) => (p.office ?? "") === officeFilter);
    }
    if (q) {
      profiles = profiles.filter((p) => {
        const haystack = [p.fullName, p.jobTitle, p.department, p.office]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    // Prefer start-date ordering for new-starter widgets
    if (newStarterOnly) {
      profiles = profiles.sort((a, b) =>
        (b.startDate ?? "").localeCompare(a.startDate ?? ""),
      );
    }

    if (limit > 0) {
      profiles = profiles.slice(0, limit);
    }

    return NextResponse.json(
      { profiles },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return handleApiError(e);
  }
}
