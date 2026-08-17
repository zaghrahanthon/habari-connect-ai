"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Render form only on client — avoids hydration mismatch from browser extensions
  // (e.g. password managers adding fdprocessedid to inputs)
  useEffect(() => {
    setMounted(true);
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
      const dbError = result.error === "DATABASE_UNAVAILABLE";
      setError(
        dbError
          ? "Could not reach the database. After changing .env, stop the dev server (Ctrl+C) and run npm run dev again. Confirm npm run db:seed succeeds, then sign in with admin@habarimedia.com / Admin123!"
          : "Invalid email or password. Use admin@habarimedia.com / Admin123! (run npm run db:seed if you have not yet).",
      );
      return;
    }

    // Verify admin role via session check
    const res = await fetch("/api/auth/session");
    const session = await res.json();

    if (session?.user?.role !== "admin") {
      setError("This account does not have admin access.");
      await fetch("/api/auth/signout", { method: "POST" });
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-xl">
            🔐
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-foreground">Admin Login</h1>
          <p className="mt-2 text-sm text-muted">Habari Connect AI — Admin Portal</p>
        </div>

        {!mounted ? (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
            <div className="space-y-4 animate-pulse">
              <div className="h-10 rounded-xl bg-border" />
              <div className="h-10 rounded-xl bg-border" />
              <div className="h-12 rounded-xl bg-border" />
            </div>
          </div>
        ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8"
        >
          {error && (
            <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="space-y-4">
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
                autoComplete="email"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
                placeholder="admin@habarimedia.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-muted">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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
          </div>
        </form>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/dashboard" className="text-accent hover:text-accent-hover">
            ← Back to employee dashboard
          </Link>
        </p>

        {/* TODO: MFA for admin login */}
      </div>
    </div>
  );
}
