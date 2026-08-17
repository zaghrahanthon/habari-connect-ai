import { describe, expect, it } from "vitest";
import {
  fullName,
  initials,
  isEffectivelyNewStarter,
  toPublicPeopleProfile,
} from "@/lib/peopleHelpers";

describe("peopleHelpers", () => {
  it("builds full name and initials", () => {
    expect(fullName({ firstName: "Sarah", lastName: "Jacobs" })).toBe(
      "Sarah Jacobs",
    );
    expect(initials({ firstName: "Sarah", lastName: "Jacobs" })).toBe("SJ");
  });

  it("respects manual new starter and date window", () => {
    expect(
      isEffectivelyNewStarter({
        isNewStarter: true,
        startDate: "2020-01-01",
      }),
    ).toBe(true);

    expect(
      isEffectivelyNewStarter({
        isNewStarter: false,
        startDate: new Date().toISOString().slice(0, 10),
      }),
    ).toBe(true);

    expect(
      isEffectivelyNewStarter({
        isNewStarter: false,
        startDate: "2018-01-01",
      }),
    ).toBe(false);
  });

  it("hides contact fields based on visibility flags", () => {
    const publicProfile = toPublicPeopleProfile({
      id: "1",
      firstName: "Sarah",
      lastName: "Jacobs",
      jobTitle: "Coordinator",
      department: "Marketing",
      office: "Cape Town",
      startDate: "2026-08-12",
      shortIntro: "Hello",
      bio: null,
      interests: null,
      skills: null,
      email: "sarah@example.com",
      phone: "123",
      manager: "Alex",
      linkedInUrl: "https://linkedin.com/in/sarah",
      birthday: "1990-01-01",
      imageUrl: null,
      isNewStarter: true,
      isPublished: true,
      showEmail: true,
      showPhone: false,
      showBirthday: false,
      showLinkedIn: true,
      displayOrder: 0,
    });

    expect(publicProfile.email).toBe("sarah@example.com");
    expect(publicProfile.phone).toBeNull();
    expect(publicProfile.birthday).toBeNull();
    expect(publicProfile.linkedInUrl).toContain("linkedin.com");
  });
});
