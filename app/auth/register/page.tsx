"use client";

import Link from "next/link";
import { useState } from "react";
import AuthCard from "@/components/AuthCard";

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    password: "",
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Hash password with bcrypt and save user to database via Prisma
    // TODO: Send SMS OTP using SMS_API_KEY for mobile verification
    console.log("Create account:", form);
  };

  const handleGoogleSignUp = () => {
    // TODO: Implement Google OAuth registration flow
    alert("Google registration will be connected here. See lib/auth.ts");
  };

  const handleMicrosoftSignUp = () => {
    // TODO: Implement Microsoft OAuth registration flow
    alert("Microsoft registration will be connected here. See lib/auth.ts");
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join Habari Connect AI"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-accent hover:text-accent-hover">
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-card-hover"
        >
          Continue with Google
        </button>
        <button
          type="button"
          onClick={handleMicrosoftSignUp}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-card-hover"
        >
          Continue with Microsoft
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted">or register with email</span>
          </div>
        </div>

        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-muted">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-muted">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              placeholder="you@habarimedia.com"
            />
          </div>

          <div>
            <label htmlFor="mobile" className="mb-2 block text-sm font-medium text-muted">
              Mobile Number
            </label>
            <input
              id="mobile"
              type="tel"
              value={form.mobileNumber}
              onChange={(e) => updateField("mobileNumber", e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              placeholder="+27 ..."
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Create Account
          </button>
        </form>
      </div>
    </AuthCard>
  );
}
