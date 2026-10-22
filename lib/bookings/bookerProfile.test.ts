import { describe, expect, it } from "vitest";
import { matchBookerProfile, toBookedBy } from "@/lib/bookings/booker";

const profiles = [
  {
    id: "p1",
    firstName: "Thandi",
    lastName: "Mokoena",
    jobTitle: "Marketing Manager",
    imageUrl: "/uploads/people/thandi.jpg",
    email: "thandi.mokoena@habarimedia.com",
  },
  {
    id: "p2",
    firstName: "Admin",
    lastName: "User",
    jobTitle: "Office Manager",
    imageUrl: null,
    email: "admin@habarimedia.com",
  },
];

describe("booker profile matching", () => {
  it("matches a People & Culture profile by email", () => {
    const match = matchBookerProfile(
      {
        id: "u1",
        firstName: "Admin",
        lastName: "User",
        email: "admin@habarimedia.com",
      },
      profiles,
    );
    expect(match?.id).toBe("p2");
    expect(toBookedBy({ id: "u1" }, match).name).toBe("Admin User");
    expect(toBookedBy({ id: "u1" }, match).profileHref).toBe(
      "/dashboard/people-culture/p2",
    );
  });

  it("matches by first and last name when email is missing", () => {
    const match = matchBookerProfile(
      { id: "u2", firstName: "Thandi", lastName: "Mokoena" },
      profiles,
    );
    expect(match?.jobTitle).toBe("Marketing Manager");
  });

  it("falls back to the account name when no profile exists", () => {
    const booked = toBookedBy(
      { id: "u3", firstName: "New", lastName: "Starter" },
      null,
    );
    expect(booked.name).toBe("New Starter");
    expect(booked.profileHref).toBeNull();
  });
});
