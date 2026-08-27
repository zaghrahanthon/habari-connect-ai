import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-utils";

/** Ensure the GA property exists in DB and is active before calling Google. */
export async function requireActiveAnalyticsProperty(propertyId: string) {
  const property = await prisma.analyticsProperty.findFirst({
    where: {
      OR: [{ id: propertyId }, { propertyId }],
      isActive: true,
    },
  });

  if (!property) {
    return {
      property: null,
      error: jsonError(
        "Analytics property not found or inactive.",
        404,
      ),
    };
  }

  return { property, error: null };
}
