import { Suspense } from "react";
import AnalyticsReportsPage from "./ReportsClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted">
          Loading reports…
        </div>
      }
    >
      <AnalyticsReportsPage />
    </Suspense>
  );
}
