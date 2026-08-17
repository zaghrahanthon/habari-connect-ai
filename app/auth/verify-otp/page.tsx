"use client";

import Link from "next/link";
import { useState } from "react";
import AuthCard from "@/components/AuthCard";

export default function VerifyOtpPage() {
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Validate OTP against OtpCode table in database
    // TODO: Check expiresAt and attempts fields
    setVerified(true);
  };

  return (
    <AuthCard
      title="Verify your code"
      subtitle="Enter the 6-digit code sent to your phone"
      footer={
        <Link href="/auth/sign-in" className="text-accent hover:text-accent-hover">
          ← Back to sign in
        </Link>
      }
    >
      {verified ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted">Code verified successfully.</p>
          <Link
            href="/auth/sign-in"
            className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Continue to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="otp" className="mb-2 block text-sm font-medium text-muted">
              Verification code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-2xl tracking-[0.5em] text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              placeholder="000000"
            />
          </div>
          <button
            type="submit"
            disabled={code.length !== 6}
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Verify code
          </button>
          <p className="text-xs text-muted">
            {/* TODO: Resend OTP via SMS_API_KEY with rate limiting */}
            Didn&apos;t receive a code? Resend will be available when SMS is configured.
          </p>
        </form>
      )}
    </AuthCard>
  );
}
