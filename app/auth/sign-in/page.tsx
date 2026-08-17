"use client";

import Link from "next/link";
import { useState } from "react";
import AuthCard from "@/components/AuthCard";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to NextAuth credentials provider and validate against database
    console.log("Sign in with email:", email);
  };

  const handleGoogleSignIn = () => {
    // TODO: Implement Google OAuth with NextAuth
    // signIn("google", { callbackUrl: "/dashboard" })
    alert("Google sign-in will be connected here. See lib/auth.ts");
  };

  const handleMicrosoftSignIn = () => {
    // TODO: Implement Microsoft OAuth with NextAuth
    // signIn("azure-ad", { callbackUrl: "/dashboard" })
    alert("Microsoft sign-in will be connected here. See lib/auth.ts");
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to Habari Connect AI"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-accent hover:text-accent-hover">
            Create one
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-card-hover"
        >
          Continue with Google
        </button>
        <button
          type="button"
          onClick={handleMicrosoftSignIn}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-card-hover"
        >
          Continue with Microsoft
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted">or</span>
          </div>
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-muted">
              Email
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
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-muted">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-accent hover:text-accent-hover"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Continue with Email
          </button>
        </form>

        <p className="text-center text-xs text-muted">
          Demo: use onboarding or go directly to{" "}
          <Link href="/dashboard" className="text-accent">
            dashboard
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
