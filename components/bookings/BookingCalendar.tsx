"use client";

import {
  parseYmd,
  roomTone,
  toYmd,
  type CalendarView,
} from "@/components/bookings/bookingUi";
import type { SerializedBooking } from "@/lib/bookings/serialize";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16];

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function monthGrid(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

function hourOffset(iso: string) {
  const date = new Date(iso);
  const hours = date.getHours() + date.getMinutes() / 60;
  return (hours - 8) * 48;
}

export default function BookingCalendar({
  view,
  onViewChange,
  cursor,
  onCursorChange,
  bookings,
  selectedDate,
  onSelectDate,
  onSelectBooking,
}: {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  cursor: Date;
  onCursorChange: (date: Date) => void;
  bookings: SerializedBooking[];
  selectedDate: string;
  onSelectDate: (ymd: string) => void;
  onSelectBooking: (booking: SerializedBooking) => void;
}) {
  const label =
    view === "month"
      ? cursor.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })
      : view === "week"
        ? `Week of ${startOfWeek(cursor).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`
        : cursor.toLocaleDateString("en-ZA", {
            weekday: "long",
            day: "numeric",
            month: "long",
          });

  const shift = (dir: number) => {
    const next = new Date(cursor);
    if (view === "month") next.setMonth(next.getMonth() + dir);
    else next.setDate(next.getDate() + dir * (view === "week" ? 7 : 1));
    onCursorChange(next);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(cursor), i),
  );

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="rounded-lg border border-border p-2 text-muted hover:bg-card-hover hover:text-foreground"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onCursorChange(new Date())}
            className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-card-hover"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            className="rounded-lg border border-border p-2 text-muted hover:bg-card-hover hover:text-foreground"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="ml-1 text-sm font-semibold text-foreground sm:text-base">
            {label}
          </h2>
        </div>
        <div className="inline-flex rounded-xl border border-border p-1 text-sm">
          {(["month", "week", "day"] as CalendarView[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onViewChange(item)}
              className={cn(
                "rounded-lg px-3 py-1.5 capitalize",
                view === item
                  ? "bg-accent/15 text-accent-hover"
                  : "text-muted hover:text-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {view === "month" ? (
        <div className="mt-4 grid grid-cols-7 gap-px rounded-xl border border-border bg-border">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="bg-card px-2 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted"
            >
              {day}
            </div>
          ))}
          {monthGrid(cursor).map((day) => {
            const ymd = toYmd(day);
            const inMonth = day.getMonth() === cursor.getMonth();
            const dayBookings = bookings.filter(
              (b) => toYmd(new Date(b.startTime)) === ymd,
            );
            const selected = selectedDate === ymd;
            return (
              <button
                key={ymd}
                type="button"
                onClick={() => onSelectDate(ymd)}
                className={cn(
                  "min-h-[92px] bg-card p-2 text-left hover:bg-card-hover",
                  !inMonth && "opacity-40",
                  selected && "ring-1 ring-inset ring-accent/40",
                )}
              >
                <span className="text-xs text-muted">{day.getDate()}</span>
                <div className="mt-1 space-y-1">
                  {dayBookings.slice(0, 3).map((booking) => (
                    <span
                      key={booking.id}
                      className={cn(
                        "block truncate rounded border px-1.5 py-0.5 text-[11px]",
                        roomTone(booking.roomName).event,
                      )}
                    >
                      {booking.display.startTime} {booking.roomName}
                    </span>
                  ))}
                  {dayBookings.length > 3 ? (
                    <span className="text-[11px] text-muted">
                      +{dayBookings.length - 3} more
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {view !== "month" ? (
        <div className="mt-4 overflow-x-auto">
          <div
            className="grid min-w-[640px]"
            style={{
              gridTemplateColumns: `64px repeat(${view === "day" ? 1 : 7}, minmax(0, 1fr))`,
            }}
          >
            <div />
            {(view === "day" ? [cursor] : weekDays).map((day) => (
              <button
                key={toYmd(day)}
                type="button"
                onClick={() => onSelectDate(toYmd(day))}
                className={cn(
                  "border-b border-border px-2 py-2 text-center text-xs",
                  selectedDate === toYmd(day)
                    ? "text-accent-hover"
                    : "text-muted",
                )}
              >
                {day.toLocaleDateString("en-ZA", {
                  weekday: "short",
                  day: "numeric",
                })}
              </button>
            ))}
            <div className="relative">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-12 border-t border-border/70 pr-2 text-right text-[11px] text-muted"
                >
                  {String(hour).padStart(2, "0")}:00
                </div>
              ))}
            </div>
            {(view === "day" ? [cursor] : weekDays).map((day) => {
              const ymd = toYmd(day);
              const dayBookings = bookings.filter(
                (b) => toYmd(new Date(b.startTime)) === ymd,
              );
              return (
                <div
                  key={ymd}
                  className="relative border-l border-border/70"
                  style={{ height: HOURS.length * 48 }}
                >
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="h-12 border-t border-border/60"
                    />
                  ))}
                  {dayBookings.map((booking) => {
                    const top = Math.max(0, hourOffset(booking.startTime));
                    const height = Math.max(
                      24,
                      (booking.durationMinutes / 60) * 48,
                    );
                    return (
                      <button
                        key={booking.id}
                        type="button"
                        onClick={() => onSelectBooking(booking)}
                        className={cn(
                          "absolute left-1 right-1 overflow-hidden rounded-lg border px-1.5 py-1 text-left text-[11px] leading-tight",
                          roomTone(booking.roomName).event,
                        )}
                        style={{ top, height }}
                      >
                        <span className="block font-medium">{booking.title}</span>
                        <span className="block opacity-80">{booking.roomName}</span>
                        <span className="block truncate opacity-80">
                          {booking.bookedBy.name}
                        </span>
                      </button>
                    );
                  })}
                  {dayBookings.length === 0 && view === "day" ? (
                    <p className="absolute inset-x-2 top-4 text-sm text-muted">
                      No bookings scheduled for this day.
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

void parseYmd;
