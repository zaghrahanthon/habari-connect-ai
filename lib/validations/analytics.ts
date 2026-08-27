import { z } from "zod";

export const analyticsPropertySchema = z.object({
  propertyId: z
    .string()
    .min(1, "GA4 Property ID is required")
    .regex(/^\d+$/, "GA4 Property ID must be numeric"),
  name: z.string().min(1, "Property name is required"),
  brand: z.string().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
});

export const analyticsReportRequestSchema = z.object({
  propertyId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reportType: z.enum([
    "overview",
    "traffic",
    "content",
    "audience",
    "technology",
    "trend",
  ]),
  trendMetric: z
    .enum(["totalUsers", "sessions", "screenPageViews"])
    .optional()
    .default("sessions"),
  refresh: z.boolean().optional().default(false),
});

export const analyticsSavedReportSchema = z.object({
  name: z.string().min(1),
  propertyId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  comparePrevious: z.boolean().default(true),
  sections: z
    .array(
      z.enum([
        "executiveSummary",
        "trafficOverview",
        "trafficSources",
        "topPages",
        "audience",
        "devices",
        "locations",
        "keyInsights",
        "recommendations",
      ]),
    )
    .min(1),
  generateAi: z.boolean().default(true),
});
