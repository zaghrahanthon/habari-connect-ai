import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleZodError(error: ZodError) {
  const message = error.issues.map((i) => i.message).join(", ");
  return jsonError(message, 400);
}

export function handleApiError(error: unknown, fallback = "Something went wrong") {
  console.error(error);
  if (error instanceof ZodError) {
    return handleZodError(error);
  }
  return jsonError(fallback, 500);
}
