import DashboardShell from "@/components/DashboardShell";
import CalendarPageClient from "@/components/calendar/CalendarPageClient";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  return (
    <DashboardShell>
      <CalendarPageClient />
    </DashboardShell>
  );
}
