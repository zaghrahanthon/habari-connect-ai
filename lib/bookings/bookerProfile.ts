import { prisma } from "@/lib/prisma";
import {
  matchBookerProfile,
  toBookedBy,
  type BookerProfileMatch,
  type BookerUser,
} from "@/lib/bookings/booker";
import { serializeBooking, type BookingRecord } from "@/lib/bookings/serialize";

export async function loadBookerProfiles(): Promise<BookerProfileMatch[]> {
  if (typeof prisma.peopleProfile?.findMany !== "function") return [];
  return prisma.peopleProfile.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      imageUrl: true,
      email: true,
    },
  });
}

export async function findBookerProfile(user: BookerUser) {
  const profiles = await loadBookerProfiles();
  return matchBookerProfile(user, profiles);
}

export async function serializeBookings(bookings: BookingRecord[]) {
  const profiles = await loadBookerProfiles();
  return bookings.map((booking) =>
    serializeBooking(booking, matchBookerProfile(booking.user, profiles)),
  );
}

