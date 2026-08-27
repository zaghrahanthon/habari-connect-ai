import { BetaAnalyticsDataClient } from "@google-analytics/data";

export class AnalyticsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalyticsConfigError";
  }
}

export class AnalyticsAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalyticsAccessError";
  }
}

/**
 * Prefer dedicated GA credentials; fall back to the shared calendar service account.
 * Never expose these values to the browser.
 */
export function getAnalyticsServiceAccountCredentials() {
  const email = (
    process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL?.trim() ||
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ||
    ""
  );
  const privateKey = (
    process.env.GOOGLE_ANALYTICS_PRIVATE_KEY ||
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    ""
  ).replace(/\\n/g, "\n");

  if (!email || !privateKey) {
    throw new AnalyticsConfigError(
      "Google Analytics credentials are missing. Set GOOGLE_ANALYTICS_CLIENT_EMAIL and GOOGLE_ANALYTICS_PRIVATE_KEY (or reuse GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) in .env.",
    );
  }

  return { email, privateKey };
}

let cachedClient: BetaAnalyticsDataClient | null = null;
let cachedKey = "";

export function getAnalyticsClient(): BetaAnalyticsDataClient {
  const { email, privateKey } = getAnalyticsServiceAccountCredentials();
  const key = `${email}:${privateKey.slice(0, 32)}`;
  if (cachedClient && cachedKey === key) return cachedClient;

  cachedClient = new BetaAnalyticsDataClient({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
  });
  cachedKey = key;
  return cachedClient;
}

export function toGaPropertyResource(propertyId: string): string {
  const id = propertyId.replace(/^properties\//, "").trim();
  if (!/^\d+$/.test(id)) {
    throw new AnalyticsConfigError(
      "GA4 Property ID must be numeric (e.g. 339660511).",
    );
  }
  return `properties/${id}`;
}

export function getAnalyticsCacheSeconds(): number {
  const raw = Number(process.env.ANALYTICS_CACHE_SECONDS ?? "900");
  return Number.isFinite(raw) && raw > 0 ? raw : 900;
}

export function isAnalyticsConfigured(): boolean {
  try {
    getAnalyticsServiceAccountCredentials();
    return true;
  } catch {
    return false;
  }
}

export function getAnalyticsServiceAccountEmail(): string | null {
  try {
    return getAnalyticsServiceAccountCredentials().email;
  } catch {
    return null;
  }
}
