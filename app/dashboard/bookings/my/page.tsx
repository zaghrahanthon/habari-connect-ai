import DashboardShell from "@/components/DashboardShell";
import MyBookingsClient from "@/components/bookings/MyBookingsClient";

export default function MyBookingsPage() {
  return (
    <DashboardShell>
      <MyBookingsClient />
    </DashboardShell>
  );
}
