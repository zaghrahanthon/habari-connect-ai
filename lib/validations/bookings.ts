import { z } from "zod";
import { DURATION_OPTIONS_MINUTES } from "@/lib/bookings/hours";
import { isValidDateString, isValidTimeString } from "@/lib/bookings/time";

export const createBookingSchema = z.object({
  roomId: z.string().min(1, "Please choose a meeting room."),
  title: z.string().trim().min(1, "Meeting title is required.").max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  date: z.string().refine(isValidDateString, "Please choose a valid date."),
  startTime: z
    .string()
    .refine(isValidTimeString, "Please choose a valid start time."),
  durationMinutes: z
    .number()
    .int()
    .refine(
      (value) => (DURATION_OPTIONS_MINUTES as readonly number[]).includes(value),
      "Please choose a valid duration.",
    ),
});

export const rescheduleBookingSchema = createBookingSchema.partial({
  roomId: true,
  title: true,
  description: true,
}).extend({
  date: z.string().refine(isValidDateString, "Please choose a valid date."),
  startTime: z
    .string()
    .refine(isValidTimeString, "Please choose a valid start time."),
  durationMinutes: z
    .number()
    .int()
    .refine(
      (value) => (DURATION_OPTIONS_MINUTES as readonly number[]).includes(value),
      "Please choose a valid duration.",
    ),
});
