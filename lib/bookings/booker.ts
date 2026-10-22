import { displayName } from "@/lib/bookings/permissions";
import { fullName, initials } from "@/lib/peopleHelpers";

export type BookerUser = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  name?: string | null;
};

export type BookerProfileMatch = {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  imageUrl: string | null;
  email?: string | null;
};

export type BookedBy = {
  id: string;
  name: string;
  jobTitle: string | null;
  imageUrl: string | null;
  profileId: string | null;
  profileHref: string | null;
  initials: string;
};

function normalise(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function matchBookerProfile(
  user: BookerUser,
  profiles: BookerProfileMatch[],
): BookerProfileMatch | null {
  const email = normalise(user.email);
  if (email) {
    const byEmail = profiles.find((profile) => normalise(profile.email) === email);
    if (byEmail) return byEmail;
  }

  const name = normalise(displayName(user));
  if (!name || name === "habari employee") return null;

  const exact = profiles.filter((profile) => normalise(fullName(profile)) === name);
  if (exact.length === 1) return exact[0];

  const first = normalise(user.firstName);
  const last = normalise(user.lastName);
  if (first && last) {
    const byParts = profiles.filter(
      (profile) =>
        normalise(profile.firstName) === first &&
        normalise(profile.lastName) === last,
    );
    if (byParts.length === 1) return byParts[0];
  }

  return null;
}

export function toBookedBy(
  user: BookerUser,
  profile: BookerProfileMatch | null,
): BookedBy {
  if (profile) {
    return {
      id: user.id,
      name: fullName(profile),
      jobTitle: profile.jobTitle || null,
      imageUrl: profile.imageUrl,
      profileId: profile.id,
      profileHref: `/dashboard/people-culture/${profile.id}`,
      initials: initials(profile),
    };
  }

  const name = displayName(user);
  const parts = name.split(" ").filter(Boolean);
  const fallbackInitials = `${parts[0]?.[0] ?? "H"}${parts[1]?.[0] ?? ""}`.toUpperCase();
  return {
    id: user.id,
    name,
    jobTitle: null,
    imageUrl: null,
    profileId: null,
    profileHref: null,
    initials: fallbackInitials || "H",
  };
}
