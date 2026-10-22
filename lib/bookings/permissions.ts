export type BookingActor = {
  id: string;
  role: string;
};

export function isAdminRole(role: string | undefined | null): boolean {
  return role === "admin";
}

export function displayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
}): string {
  const fromParts = [user.firstName, user.lastName].filter(Boolean).join(" ");
  if (fromParts) return fromParts;
  if (user.name?.trim()) return user.name.trim();
  return "Habari employee";
}

export function canCancelBooking(
  actor: BookingActor,
  booking: { userId: string; status: string; startTime: Date },
  now = new Date(),
): { ok: true } | { ok: false; reason: string } {
  if (booking.status === "CANCELLED") {
    return { ok: false, reason: "This booking is already cancelled." };
  }
  if (booking.startTime.getTime() <= now.getTime()) {
    return { ok: false, reason: "Past bookings cannot be cancelled." };
  }
  if (actor.id === booking.userId || isAdminRole(actor.role)) {
    return { ok: true };
  }
  return { ok: false, reason: "You can only cancel your own bookings." };
}

export function canRescheduleBooking(
  actor: BookingActor,
  booking: { userId: string; status: string; startTime: Date },
  now = new Date(),
): { ok: true } | { ok: false; reason: string } {
  return canCancelBooking(actor, booking, now);
}
