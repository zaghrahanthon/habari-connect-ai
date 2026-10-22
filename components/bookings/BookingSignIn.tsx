"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

export default function BookingSignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    onSignedIn();
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-foreground">
        Sign in to book a boardroom
      </h1>
      <p className="mt-2 text-sm text-muted">
        Use your Habari Connect account. Bookings are saved against the person
        who signs in.
      </p>
      {!mounted ? (
        <div className="mt-6 space-y-3 animate-pulse">
          <div className="h-10 rounded-xl bg-border" />
          <div className="h-10 rounded-xl bg-border" />
          <div className="h-12 rounded-xl bg-border" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error ? (
            <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          ) : null}
          <div>
            <label htmlFor="booking-email" className="mb-2 block text-sm font-medium text-muted">
              Email
            </label>
            <input
              id="booking-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>
          <div>
            <label htmlFor="booking-password" className="mb-2 block text-sm font-medium text-muted">
              Password
            </label>
            <input
              id="booking-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}
    </div>
  );
}
