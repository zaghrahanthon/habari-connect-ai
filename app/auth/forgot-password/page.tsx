"use client";

import Link from "next/link";
import { useState } from "react";
import AuthCard from "@/components/AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Generate OTP, save to OtpCode table, send via SMS_API_KEY
    setSubmitted(true);
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll send you a verification code"
      footer={
        <Link href="/auth/sign-in" className="text-accent hover:text-accent-hover">
          ← Back to sign in
        </Link>
      }
    >
      {submitted ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted">
            If an account exists for <strong className="text-foreground">{email}</strong>,
            you will receive a verification code shortly.
          </p>
          <Link
            href="/auth/verify-otp"
            className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Enter verification code
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-muted">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              placeholder="you@habarimedia.com"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Send reset code
          </button>
          <p className="text-xs text-muted">
            {/* TODO: Integrate SMS OTP delivery using SMS_API_KEY */}
            OTP will be sent to your registered mobile number when SMS is configured.
          </p>
        </form>
      )}
    </AuthCard>
  );
}
