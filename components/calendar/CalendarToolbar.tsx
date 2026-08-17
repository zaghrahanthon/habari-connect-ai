"use client";

import { cn } from "@/lib/utils";

export type CalendarPreset =
  | "today"
  | "week"
  | "month"
  | "upcoming"
  | "all";

export type CalendarDisplayMode = "list" | "calendar";

type CalendarToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  department: string;
  onDepartmentChange: (value: string) => void;
  categories: string[];
  departments: string[];
  preset: CalendarPreset;
  onPresetChange: (value: CalendarPreset) => void;
  mode: CalendarDisplayMode;
  onModeChange: (value: CalendarDisplayMode) => void;
};

const PRESETS: { id: CalendarPreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All" },
];

export default function CalendarToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  department,
  onDepartmentChange,
  categories,
  departments,
  preset,
  onPresetChange,
  mode,
  onModeChange,
}: CalendarToolbarProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPresetChange(item.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
              preset === item.id
                ? "bg-accent text-white"
                : "border border-border text-muted hover:bg-card-hover hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="block md:col-span-2">
          <span className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events, locations, organisers…"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Category
          </span>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Department
          </span>
          <select
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          >
            <option value="">All departments</option>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex gap-2">
        {(["list", "calendar"] as CalendarDisplayMode[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onModeChange(item)}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
              mode === item
                ? "bg-accent/15 text-accent-hover"
                : "text-muted hover:bg-card-hover hover:text-foreground",
            )}
          >
            {item} view
          </button>
        ))}
      </div>
    </div>
  );
}
