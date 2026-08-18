import dns from "node:dns";
import net from "node:net";

/**
 * NETWORK WORKAROUND — not application logic. See instrumentation.ts for the
 * full diagnosis. Node-only, so it lives in its own module: Next.js analyses
 * instrumentation.ts for the Edge runtime as well, and `node:net` there would
 * emit a build warning even behind a runtime guard.
 */
export function forceIpv4Egress() {
  net.setDefaultAutoSelectFamily(false);
  dns.setDefaultResultOrder("ipv4first");
}
