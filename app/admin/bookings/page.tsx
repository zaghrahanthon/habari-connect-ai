"use client";

import AdminShell from "@/components/admin/AdminShell";
import BookingWorkspace from "@/components/bookings/BookingWorkspace";

export default function AdminBookingsPage() {
  return (
    <AdminShell>
      <BookingWorkspace isAdmin myBookingsHref="/dashboard/bookings/my" />
    </AdminShell>
  );
}
