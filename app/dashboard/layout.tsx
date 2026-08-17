import { redirect } from "next/navigation";
import {
  assertOfficeNetwork,
  OfficeNetworkRequiredError,
} from "@/lib/networkAccess";

export const dynamic = "force-dynamic";

/**
 * Server-side office-network gate for employee dashboard pages.
 * Middleware also enforces this; the layout is defense-in-depth.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await assertOfficeNetwork("/dashboard");
  } catch (error) {
    if (error instanceof OfficeNetworkRequiredError) {
      redirect(`/office-network-required?ref=${error.referenceId}`);
    }
    redirect("/office-network-required");
  }

  return children;
}
