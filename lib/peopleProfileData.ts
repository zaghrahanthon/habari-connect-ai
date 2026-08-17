import type { z } from "zod";
import type { peopleProfileSchema } from "@/lib/validations/admin";

type PeopleInput = z.infer<typeof peopleProfileSchema>;

function parseOptionalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toPeopleProfileData(data: PeopleInput) {
  return {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    jobTitle: data.jobTitle.trim(),
    department: data.department?.trim() || null,
    office: data.office?.trim() || null,
    startDate: parseOptionalDate(data.startDate),
    shortIntro: data.shortIntro?.trim() || null,
    bio: data.bio?.trim() || null,
    interests: data.interests?.trim() || null,
    skills: data.skills?.trim() || null,
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    manager: data.manager?.trim() || null,
    linkedInUrl: data.linkedInUrl?.trim() || null,
    birthday: parseOptionalDate(data.birthday),
    imageUrl: data.imageUrl?.trim() || null,
    isNewStarter: data.isNewStarter,
    isPublished: data.isPublished,
    showEmail: data.showEmail,
    showPhone: data.showPhone,
    showBirthday: data.showBirthday,
    showLinkedIn: data.showLinkedIn,
    displayOrder: data.displayOrder ?? 0,
  };
}
