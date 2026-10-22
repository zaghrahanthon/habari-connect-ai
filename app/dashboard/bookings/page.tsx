import DashboardShell from "@/components/DashboardShell";
import BookingWorkspace from "@/components/bookings/BookingWorkspace";

export default function EmployeeBookingsPage() {
  return (
    <DashboardShell>
      <BookingWorkspace />
    </DashboardShell>
  );
}
