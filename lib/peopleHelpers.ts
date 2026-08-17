import { addDays, format, isValid, parseISO } from "date-fns";

export type PeopleProfileRecord = {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string | null;
  office: string | null;
  startDate: Date | string | null;
  shortIntro: string | null;
  bio: string | null;
  interests: string | null;
  skills: string | null;
  email: string | null;
  phone: string | null;
  manager: string | null;
  linkedInUrl: string | null;
  birthday: Date | string | null;
  imageUrl: string | null;
  isNewStarter: boolean;
  isPublished: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showBirthday: boolean;
  showLinkedIn: boolean;
  displayOrder: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const parsed = parseISO(value.includes("T") ? value : `${value}T12:00:00`);
  return isValid(parsed) ? parsed : null;
}

export function getNewStarterDays(): number {
  const raw = Number(process.env.NEW_STARTER_DAYS ?? "60");
  return Number.isFinite(raw) && raw > 0 ? raw : 60;
}

/**
 * Manual isNewStarter stays the primary admin control.
 * If startDate is set, also treat as new while within NEW_STARTER_DAYS.
 */
export function isEffectivelyNewStarter(profile: {
  isNewStarter: boolean;
  startDate: Date | string | null;
}): boolean {
  if (profile.isNewStarter) return true;
  const start = toDate(profile.startDate);
  if (!start) return false;
  const cutoff = addDays(start, getNewStarterDays());
  return new Date() <= cutoff;
}

export function fullName(profile: { firstName: string; lastName: string }): string {
  return `${profile.firstName} ${profile.lastName}`.trim();
}

export function initials(profile: { firstName: string; lastName: string }): string {
  const a = profile.firstName.trim().charAt(0);
  const b = profile.lastName.trim().charAt(0);
  return `${a}${b}`.toUpperCase() || "?";
}

export function formatPeopleDate(value: Date | string | null | undefined): string | null {
  const date = toDate(value);
  if (!date) return null;
  return format(date, "d MMMM yyyy");
}

/** Employee-facing DTO — strips unpublished fields and respects visibility flags. */
export function toPublicPeopleProfile(profile: PeopleProfileRecord) {
  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    fullName: fullName(profile),
    initials: initials(profile),
    jobTitle: profile.jobTitle,
    department: profile.department,
    office: profile.office,
    startDate: profile.startDate
      ? toDate(profile.startDate)?.toISOString().slice(0, 10) ?? null
      : null,
    startDateLabel: formatPeopleDate(profile.startDate),
    shortIntro: profile.shortIntro,
    bio: profile.bio,
    interests: profile.interests,
    skills: profile.skills,
    manager: profile.manager,
    email: profile.showEmail ? profile.email : null,
    phone: profile.showPhone ? profile.phone : null,
    linkedInUrl: profile.showLinkedIn ? profile.linkedInUrl : null,
    birthday: profile.showBirthday
      ? toDate(profile.birthday)?.toISOString().slice(0, 10) ?? null
      : null,
    birthdayLabel: profile.showBirthday
      ? formatPeopleDate(profile.birthday)
      : null,
    imageUrl: profile.imageUrl,
    isNewStarter: isEffectivelyNewStarter(profile),
    displayOrder: profile.displayOrder,
  };
}

export type PublicPeopleProfile = ReturnType<typeof toPublicPeopleProfile>;

export function isPeopleImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith("/uploads/people/");
}
