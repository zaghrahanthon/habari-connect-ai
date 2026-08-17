"use client";

import { cn } from "@/lib/utils";

type PeopleAvatarProps = {
  imageUrl?: string | null;
  initials: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZE_CLASS = {
  sm: "h-10 w-10 text-xs",
  md: "h-14 w-14 text-sm",
  lg: "h-24 w-24 text-2xl",
  xl: "h-40 w-40 text-4xl",
} as const;

export default function PeopleAvatar({
  imageUrl,
  initials,
  alt,
  size = "md",
  className,
}: PeopleAvatarProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 ring-1 ring-border",
        SIZE_CLASS[size],
        className,
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.nextElementSibling;
            if (fallback instanceof HTMLElement) {
              fallback.classList.remove("hidden");
              fallback.classList.add("flex");
            }
          }}
        />
      ) : null}
      <div
        className={cn(
          "absolute inset-0 items-center justify-center font-semibold tracking-wide text-zinc-100",
          imageUrl ? "hidden" : "flex",
        )}
        aria-hidden={Boolean(imageUrl)}
      >
        {initials}
      </div>
    </div>
  );
}
