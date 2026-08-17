import ipaddr from "ipaddr.js";

/**
 * Pure office-network helpers (Edge + Node safe).
 *
 * Trust assumptions:
 * - On Vercel, platform headers reflect the real client IP.
 * - On bare Node, do not trust arbitrary x-forwarded-for from clients.
 * - Never accept IP from query/body/cookies/custom browser headers.
 */

const LOCAL_IPS = new Set([
  "127.0.0.1",
  "::1",
  "0:0:0:0:0:0:0:1",
  "localhost",
]);

function isTruthy(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes((value ?? "").trim().toLowerCase());
}

export function isLocalDevelopmentBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    isTruthy(process.env.ALLOW_LOCAL_DEVELOPMENT ?? "true")
  );
}

export function getOfficeAllowlist(): string[] {
  return (process.env.OFFICE_IP_ALLOWLIST ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function normaliseIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  let value = ip.trim();
  if (!value || value.toLowerCase() === "unknown") return null;

  if (value.startsWith("[") && value.includes("]")) {
    value = value.slice(1, value.indexOf("]"));
  } else {
    // IPv4 with port only (avoid mangling IPv6 / IPv4-mapped forms)
    const ipv4WithPort = value.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    if (ipv4WithPort?.[1]) value = ipv4WithPort[1];
  }

  try {
    const parsed = ipaddr.parse(value);
    if (parsed.kind() === "ipv6") {
      const v6 = parsed as ipaddr.IPv6;
      if (v6.isIPv4MappedAddress()) {
        return v6.toIPv4Address().toString();
      }
      return v6.toNormalizedString();
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function matchAllowlistEntry(ip: string, entry: string): boolean {
  try {
    if (entry.includes("/")) {
      const [rangeAddr, prefixRaw] = entry.split("/");
      const prefix = Number(prefixRaw);
      if (!rangeAddr || !Number.isFinite(prefix)) return false;
      const addr = ipaddr.parse(ip);
      const range = ipaddr.parse(rangeAddr.trim());
      if (addr.kind() !== range.kind()) return false;
      return addr.match(range, prefix);
    }

    const a = ipaddr.parse(ip);
    const b = ipaddr.parse(entry);
    if (a.kind() !== b.kind()) return false;
    return a.toString() === b.toString();
  } catch {
    return false;
  }
}

export function isIpAllowed(ip: string | null): boolean {
  const normalised = normaliseIp(ip);
  if (!normalised) return false;

  if (isLocalDevelopmentBypassEnabled() && LOCAL_IPS.has(normalised)) {
    return true;
  }

  if (process.env.NODE_ENV === "production" && LOCAL_IPS.has(normalised)) {
    return false;
  }

  const allowlist = getOfficeAllowlist();
  if (allowlist.length === 0) return false;

  return allowlist.some((entry) => matchAllowlistEntry(normalised, entry));
}

type HeaderSource = {
  get(name: string): string | null;
};

export function getRequestIp(headerSource: HeaderSource): string | null {
  const vercelForwarded = headerSource.get("x-vercel-forwarded-for");
  if (vercelForwarded) {
    return normaliseIp(vercelForwarded.split(",")[0]?.trim() ?? null);
  }

  const isVercel = Boolean(process.env.VERCEL);
  if (isVercel) {
    const xff = headerSource.get("x-forwarded-for");
    if (xff) return normaliseIp(xff.split(",")[0]?.trim() ?? null);
    return normaliseIp(headerSource.get("x-real-ip"));
  }

  if (isLocalDevelopmentBypassEnabled()) {
    return "127.0.0.1";
  }

  return normaliseIp(headerSource.get("x-real-ip"));
}

export function createAccessReferenceId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}
