import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  createAccessReferenceId,
  getRequestIp,
  isIpAllowed,
} from "@/lib/networkAccessCore";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

function withSecurityHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(NO_STORE_HEADERS)) {
    response.headers.set(key, value);
  }
  response.headers.set("Content-Security-Policy", "frame-ancestors 'self'");
  return response;
}

function isEmployeeProtectedPath(pathname: string): boolean {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return true;
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return true;
  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) return true;
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return true;
  if (pathname === "/settings" || pathname.startsWith("/settings/")) return true;
  if (pathname === "/api/chat") return true;
  if (pathname.startsWith("/api/calendar/")) return true;
  if (pathname === "/api/contacts") return true;
  if (pathname.startsWith("/api/people-culture")) return true;
  if (pathname.startsWith("/api/resources/")) return true;
  if (pathname.startsWith("/uploads/")) return true;
  return false;
}

function denyOfficeNetwork(request: NextRequest, pathname: string) {
  const ip = getRequestIp(request.headers);
  const referenceId = createAccessReferenceId();

  console.warn(
    `[network-access] DENIED ref=${referenceId} route=${pathname} ip=${ip ?? "unknown"}`,
  );

  if (pathname.startsWith("/api/") || pathname.startsWith("/uploads/")) {
    return withSecurityHeaders(
      NextResponse.json(
        {
          error:
            "Habari Connect is only available on the approved office network.",
          referenceId,
        },
        { status: 403 },
      ),
    );
  }

  const url = new URL("/office-network-required", request.url);
  url.searchParams.set("ref", referenceId);
  return withSecurityHeaders(NextResponse.redirect(url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/" ||
    pathname.startsWith("/office-network-required") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const ip = getRequestIp(request.headers);
  const onOfficeNetwork = isIpAllowed(ip);

  if (isEmployeeProtectedPath(pathname)) {
    if (!onOfficeNetwork) return denyOfficeNetwork(request, pathname);
    return withSecurityHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    if (pathname === "/admin") {
      if (!onOfficeNetwork) return denyOfficeNetwork(request, pathname);
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });
      if (token?.role === "admin") {
        return withSecurityHeaders(
          NextResponse.redirect(new URL("/admin/dashboard", request.url)),
        );
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (!onOfficeNetwork) return denyOfficeNetwork(request, pathname);

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (pathname.startsWith("/api/admin")) {
      if (!token) {
        return withSecurityHeaders(
          NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        );
      }
      if (token.role !== "admin") {
        return withSecurityHeaders(
          NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        );
      }
      return withSecurityHeaders(NextResponse.next());
    }

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (token.role !== "admin") {
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/dashboard", request.url)),
      );
    }

    return withSecurityHeaders(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/auth/:path*",
    "/uploads/:path*",
    "/api/chat",
    "/api/calendar/:path*",
    "/api/contacts",
    "/api/people-culture",
    "/api/people-culture/:path*",
    "/api/resources/:path*",
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};

// TODO: MFA for admin accounts
// TODO: Audit logs for admin actions
// TODO: Rate limiting on admin login
// TODO: Implement audited emergency access through VPN or identity-aware proxy.
