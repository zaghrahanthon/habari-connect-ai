import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { logNetworkAccess } from "@/lib/accessLog";
import {
  createAccessReferenceId,
  getRequestIp,
  isIpAllowed,
} from "@/lib/networkAccessCore";

export {
  createAccessReferenceId,
  getOfficeAllowlist,
  getRequestIp,
  isIpAllowed,
  isLocalDevelopmentBypassEnabled,
  normaliseIp,
} from "@/lib/networkAccessCore";

export class OfficeNetworkRequiredError extends Error {
  readonly referenceId: string;

  constructor(
    message = "Office network access required",
    referenceId?: string,
  ) {
    super(message);
    this.name = "OfficeNetworkRequiredError";
    this.referenceId = referenceId ?? createAccessReferenceId();
  }
}

/** Server-component / route-handler guard. Throws OfficeNetworkRequiredError. */
export async function assertOfficeNetwork(route = "unknown"): Promise<string> {
  const headerStore = await headers();
  const ip = getRequestIp(headerStore);
  const allowed = isIpAllowed(ip);
  const referenceId = createAccessReferenceId();

  logNetworkAccess({
    allowed,
    route,
    ip,
    referenceId,
  });

  if (!allowed) {
    throw new OfficeNetworkRequiredError(
      "Habari Connect is only available on the approved office network.",
      referenceId,
    );
  }

  return ip ?? "unknown";
}

/** API-route helper returning NextResponse on denial. */
export async function requireOfficeNetwork(route: string): Promise<{
  ip: string | null;
  error: NextResponse | null;
  referenceId: string;
}> {
  const headerStore = await headers();
  const ip = getRequestIp(headerStore);
  const allowed = isIpAllowed(ip);
  const referenceId = createAccessReferenceId();

  logNetworkAccess({
    allowed,
    route,
    ip,
    referenceId,
  });

  if (!allowed) {
    return {
      ip,
      referenceId,
      error: NextResponse.json(
        {
          error:
            "Habari Connect is only available on the approved office network.",
          referenceId,
        },
        {
          status: 403,
          headers: { "Cache-Control": "private, no-store" },
        },
      ),
    };
  }

  return { ip, error: null, referenceId };
}

// TODO: Implement audited emergency access through VPN or identity-aware proxy.
// Do not accept OFFICE_NETWORK_BYPASS_SECRET from query strings or browser forms.
void process.env.OFFICE_NETWORK_BYPASS_SECRET;
