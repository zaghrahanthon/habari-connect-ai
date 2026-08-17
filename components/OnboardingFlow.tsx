"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "habari_onboarding";

type AiExperience = "new" | "experienced" | null;

type OnboardingData = {
  firstName: string;
  department: string;
  aiExperience: AiExperience;
  completed: boolean;
};

/**
 * Optional first-visit welcome.
 * Preferences are stored in localStorage only.
 * This is a display preference and not a verified employee identity.
 * It does not grant permissions.
 */
export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [department, setDepartment] = useState("");
  const [aiExperience, setAiExperience] = useState<AiExperience>(null);

  const totalSteps = 5;

  const saveProgress = (data: Partial<OnboardingData>) => {
    const existing = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "{}",
    ) as Partial<OnboardingData>;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...existing, ...data }),
    );

    // Display preference only — not authenticated identity
    if (data.firstName) {
      localStorage.setItem("habari_user_name", data.firstName);
    }
    if (data.department) {
      localStorage.setItem("habari_user_department", data.department);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));

  const handleContinueStep2 = () => {
    if (!firstName.trim()) return;
    saveProgress({
      firstName: firstName.trim(),
      department: department.trim(),
    });
    nextStep();
  };

  const handleExperience = (choice: AiExperience) => {
    setAiExperience(choice);
    saveProgress({ aiExperience: choice });
  };

  const handleFinish = () => {
    saveProgress({ completed: true });
  };

  const skip = () => {
    saveProgress({ completed: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i + 1 <= step ? "bg-accent" : "bg-border",
              )}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          {step === 1 && (
            <div className="space-y-6 text-center">
              <p className="text-3xl">👋</p>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Welcome to Habari Connect
                </h1>
                <p className="mt-4 text-muted leading-relaxed">
                  Optional quick setup for a friendlier greeting. You can skip
                  this anytime — no account is created.
                </p>
              </div>
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/dashboard"
                onClick={skip}
                className="inline-flex w-full items-center justify-center text-sm text-muted hover:text-foreground"
              >
                Skip for now
              </Link>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  What should we call you?
                </h1>
                <p className="mt-2 text-sm text-muted">
                  Used only for the home-page greeting on this device.
                </p>
              </div>
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-2 block text-sm font-medium text-muted"
                >
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
                  autoFocus
                />
              </div>
              <div>
                <label
                  htmlFor="department"
                  className="mb-2 block text-sm font-medium text-muted"
                >
                  Department (optional)
                </label>
                <input
                  id="department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Editorial, Sales, IT"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
                />
              </div>
              <button
                type="button"
                onClick={handleContinueStep2}
                disabled={!firstName.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/dashboard"
                onClick={skip}
                className="inline-flex w-full items-center justify-center text-sm text-muted hover:text-foreground"
              >
                Skip for now
              </Link>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center">
              <p className="text-3xl">🎉</p>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Nice to meet you, {firstName}!
                </h1>
                <p className="mt-4 text-muted leading-relaxed">
                  Welcome to Habari Connect.
                </p>
              </div>
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Have you used AI assistants before?
                </h1>
              </div>

              {!aiExperience ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleExperience("new")}
                    className="rounded-xl border border-border bg-background px-4 py-4 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-card-hover"
                  >
                    I&apos;m new
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExperience("experienced")}
                    className="rounded-xl border border-border bg-background px-4 py-4 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-card-hover"
                  >
                    I&apos;ve used AI before
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-background p-4 text-center text-muted">
                  {aiExperience === "new" ? (
                    <>
                      <p className="font-medium text-foreground">Great!</p>
                      <p className="mt-2 text-sm leading-relaxed">
                        I&apos;ll help you learn everything as we go.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-foreground">Awesome.</p>
                      <p className="mt-2 text-sm leading-relaxed">
                        Let&apos;s get you started right away.
                      </p>
                    </>
                  )}
                </div>
              )}

              {aiExperience && (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  You&apos;re all set
                </h1>
                <p className="mt-4 text-muted">Welcome aboard.</p>
              </div>
              <Link
                href="/dashboard"
                onClick={handleFinish}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Start Exploring
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
