import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getOfficeAllowlist,
  getRequestIp,
  isIpAllowed,
  isLocalDevelopmentBypassEnabled,
  normaliseIp,
} from "@/lib/networkAccessCore";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("normaliseIp", () => {
  it("normalises IPv4 and strips ports", () => {
    expect(normaliseIp("196.10.20.30")).toBe("196.10.20.30");
    expect(normaliseIp("196.10.20.30:443")).toBe("196.10.20.30");
  });

  it("handles IPv4-mapped IPv6", () => {
    expect(normaliseIp("::ffff:192.0.2.1")).toBe("192.0.2.1");
  });

  it("rejects malformed values", () => {
    expect(normaliseIp("not-an-ip")).toBeNull();
    expect(normaliseIp("")).toBeNull();
    expect(normaliseIp(null)).toBeNull();
  });
});

describe("isIpAllowed", () => {
  it("matches a single IPv4 address", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_LOCAL_DEVELOPMENT", "false");
    vi.stubEnv("OFFICE_IP_ALLOWLIST", "196.10.20.30,196.10.20.31");
    expect(isIpAllowed("196.10.20.30")).toBe(true);
    expect(isIpAllowed("196.10.20.99")).toBe(false);
  });

  it("matches CIDR ranges", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_LOCAL_DEVELOPMENT", "false");
    vi.stubEnv("OFFICE_IP_ALLOWLIST", "102.40.50.0/24");
    expect(isIpAllowed("102.40.50.12")).toBe(true);
    expect(isIpAllowed("102.40.51.12")).toBe(false);
  });

  it("allows localhost only in development bypass", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOW_LOCAL_DEVELOPMENT", "true");
    vi.stubEnv("OFFICE_IP_ALLOWLIST", "");
    expect(isLocalDevelopmentBypassEnabled()).toBe(true);
    expect(isIpAllowed("127.0.0.1")).toBe(true);
    expect(isIpAllowed("::1")).toBe(true);

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_LOCAL_DEVELOPMENT", "true");
    expect(isIpAllowed("127.0.0.1")).toBe(false);
  });

  it("denies missing IP in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_LOCAL_DEVELOPMENT", "false");
    vi.stubEnv("OFFICE_IP_ALLOWLIST", "196.10.20.30");
    expect(isIpAllowed(null)).toBe(false);
  });

  it("trims allowlist entries", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_LOCAL_DEVELOPMENT", "false");
    vi.stubEnv("OFFICE_IP_ALLOWLIST", " 196.10.20.30 , 102.40.50.0/24 ");
    expect(getOfficeAllowlist()).toEqual([
      "196.10.20.30",
      "102.40.50.0/24",
    ]);
    expect(isIpAllowed("102.40.50.1")).toBe(true);
  });
});

describe("getRequestIp", () => {
  it("uses first comma-separated forwarded IP on Vercel", () => {
    vi.stubEnv("VERCEL", "1");
    const headers = {
      get(name: string) {
        if (name === "x-vercel-forwarded-for") return "203.0.113.10, 10.0.0.1";
        return null;
      },
    };
    expect(getRequestIp(headers)).toBe("203.0.113.10");
  });

  it("does not trust x-forwarded-for on bare Node outside local bypass", () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_LOCAL_DEVELOPMENT", "false");
    const headers = {
      get(name: string) {
        if (name === "x-forwarded-for") return "203.0.113.10";
        return null;
      },
    };
    expect(getRequestIp(headers)).toBeNull();
  });
});
