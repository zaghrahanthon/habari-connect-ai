"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { WifiOff } from "lucide-react";

function OfficeNetworkRequiredContent() {
  const params = useSearchParams();
  const referenceId = params.get("ref") ?? "UNKNOWN";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
          <WifiOff className="h-7 w-7 text-accent" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Habari Connect is available on the office network
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
          To access the employee dashboard, connect your device to the approved
          Habari Media office Wi-Fi and refresh this page.
        </p>

        <div className="mt-6 rounded-xl border border-border bg-background px-4 py-4 text-left text-sm text-muted">
          <p className="font-medium text-foreground">If you are already connected:</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Turn off mobile data or personal hotspot.</li>
            <li>Disconnect any personal VPN.</li>
            <li>Reconnect to the office Wi-Fi.</li>
            <li>Refresh the page.</li>
          </ol>
        </div>

        <button
          type="button"
          onClick={() => window.location.assign("/dashboard")}
          className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Try Again
        </button>

        <p className="mt-6 text-xs leading-relaxed text-muted">
          If access is still blocked, contact the IT administrator and provide
          the access reference shown below.
        </p>
        <p className="mt-2 font-mono text-sm text-foreground">
          Access reference: {referenceId}
        </p>

        <Link
          href="/admin/login"
          className="mt-8 inline-block text-sm text-muted hover:text-foreground"
        >
          Admin Login
        </Link>
      </div>
    </div>
  );
}

export default function OfficeNetworkRequiredPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted">
          Checking network access…
        </div>
      }
    >
      <OfficeNetworkRequiredContent />
    </Suspense>
  );
}
