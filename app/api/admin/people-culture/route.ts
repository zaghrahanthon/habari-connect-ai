import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import { prisma } from "@/lib/prisma";
import { peopleProfileSchema } from "@/lib/validations/admin";
import { toPeopleProfileData } from "@/lib/peopleProfileData";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { revalidateEmployeeSection } from "@/lib/adminRevalidate";

export async function GET(request: Request) {
  const office = await requireOfficeNetwork("/api/admin/people-culture");
  if (office.error) return office.error;

  const { error } = await requireAdmin();
  if (error) return error;

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
    const published = searchParams.get("published");
    const newStarter = searchParams.get("newStarter");

    const profiles = await prisma.peopleProfile.findMany({
      orderBy: [
        { displayOrder: "asc" },
        { lastName: "asc" },
        { firstName: "asc" },
      ],
    });

    const filtered = profiles.filter((p) => {
      if (department && (p.department ?? "") !== department) return false;
      if (officeFilter && (p.office ?? "") !== officeFilter) return false;
      if (published === "true" && !p.isPublished) return false;
      if (published === "false" && p.isPublished) return false;
      if (newStarter === "true" && !p.isNewStarter) return false;
      if (newStarter === "false" && p.isNewStarter) return false;
      if (!q) return true;
      const haystack = [
        p.firstName,
        p.lastName,
        p.jobTitle,
        p.department,
        p.office,
        p.email,
        p.manager,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    return NextResponse.json(filtered, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: Request) {
  const office = await requireOfficeNetwork("/api/admin/people-culture");
  if (office.error) return office.error;

  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const data = peopleProfileSchema.parse(await request.json());
    const profile = await prisma.peopleProfile.create({
      data: toPeopleProfileData(data),
    });
    revalidateEmployeeSection("people-culture");
    return NextResponse.json(profile, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
