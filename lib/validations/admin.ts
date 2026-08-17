import { z } from "zod";
import { KNOWLEDGE_CATEGORIES } from "@/lib/categories";

const categoryEnum = z.enum(KNOWLEDGE_CATEGORIES as unknown as [string, ...string[]]);

export const knowledgeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: categoryEnum,
  content: z.string().min(1, "Content is required"),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  isPublished: z.boolean().default(false),
  isAiVisible: z.boolean().default(true),
  isEmployeeVisible: z.boolean().default(true),
});

export const sectionSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
  buttonLabel: z.string().optional(),
  buttonUrl: z.string().optional(),
  displayOrder: z.number().int().default(0),
  isPublished: z.boolean().default(false),
});

export const resourceSchema = z.object({
  title: z.string().min(1),
  category: categoryEnum,
  description: z.string().optional(),
  fileUrl: z.string().optional(),
  fileType: z.string().optional(),
  extractedText: z.string().optional(),
  isPublished: z.boolean().default(true),
  isAiVisible: z.boolean().default(true),
  isEmployeeVisible: z.boolean().default(true),
});

export const newsSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  content: z.string().min(1),
  category: z.string().optional(),
  coverImageUrl: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export const contactSchema = z.object({
  name: z.string().min(1),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  office: z.string().optional(),
  isPublished: z.boolean().default(true),
});

const optionalUrl = z
  .string()
  .url("Enter a valid URL")
  .optional()
  .or(z.literal(""));

const optionalEmail = z
  .string()
  .email("Enter a valid email")
  .optional()
  .or(z.literal(""));

const optionalDate = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v && v.trim() ? v : null));

export const peopleProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().optional().or(z.literal("")),
  office: z.string().optional().or(z.literal("")),
  startDate: optionalDate,
  shortIntro: z.string().max(280).optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
  interests: z.string().optional().or(z.literal("")),
  skills: z.string().optional().or(z.literal("")),
  email: optionalEmail,
  phone: z.string().optional().or(z.literal("")),
  manager: z.string().optional().or(z.literal("")),
  linkedInUrl: optionalUrl,
  birthday: optionalDate,
  imageUrl: z.string().optional().or(z.literal("")),
  isNewStarter: z.boolean().default(true),
  isPublished: z.boolean().default(false),
  showEmail: z.boolean().default(true),
  showPhone: z.boolean().default(false),
  showBirthday: z.boolean().default(false),
  showLinkedIn: z.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
});

export const userUpdateSchema = z.object({
  role: z.enum(["employee", "manager", "admin"]).optional(),
  isActive: z.boolean().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});
