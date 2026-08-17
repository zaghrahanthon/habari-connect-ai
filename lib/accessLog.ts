export type NetworkAccessLogEntry = {
  timestamp: string;
  allowed: boolean;
  route: string;
  /** Normalised IP — server-only; never send allowlist to clients */
  ip: string | null;
  referenceId: string;
};

const MAX_ENTRIES = 100;
const entries: NetworkAccessLogEntry[] = [];

export function logNetworkAccess(entry: Omit<NetworkAccessLogEntry, "timestamp">) {
  const row: NetworkAccessLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  entries.unshift(row);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;

  if (!entry.allowed) {
    console.warn(
      `[network-access] DENIED ref=${entry.referenceId} route=${entry.route} ip=${entry.ip ?? "unknown"}`,
    );
  }
}

export function getRecentAccessLogs(limit = 20): NetworkAccessLogEntry[] {
  return entries.slice(0, limit);
}

export function getDeniedAccessSummaries(limit = 10) {
  return entries
    .filter((e) => !e.allowed)
    .slice(0, limit)
    .map(({ timestamp, route, referenceId, ip }) => ({
      timestamp,
      route,
      referenceId,
      // Admins may see IP for allowlist setup; still avoid dumping full allowlist here
      detectedIp: ip,
    }));
}

// TODO: Persist access logs with retention policy (e.g. 30–90 days) in production.
