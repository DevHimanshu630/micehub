/**
 * NETWORK WORKAROUND — not application logic.
 *
 * Problem: on some networks the IPv6 route to Neon's host is black-holed.
 * DNS returns both A and AAAA records, Node's fetch (undici) attempts the
 * IPv6 address, and the connection hangs until it times out — surfacing as
 * `NeonDbError: Error connecting to database: TypeError: fetch failed` on
 * every page that queries the DB. curl works because it falls back to IPv4.
 *
 * Verified on this machine: curl -4 reaches the host, curl -6 fails, and Node
 * pinned to the IPv4 literal succeeds. `--dns-result-order=ipv4first` and
 * `--network-family-autoselection-attempt-timeout` do NOT fix it, because
 * undici runs its own happy-eyeballs; the family selection has to be turned
 * off at the socket layer, which is what forceIpv4Egress does.
 *
 * Scope: skipped on Vercel, where dual-stack works correctly. This changes
 * only which address family outbound sockets use — no query, schema or
 * business logic is affected.
 *
 * To remove once the network is fixed: delete this file and
 * instrumentation-node.ts. Nothing else references them.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.VERCEL) return;

  const { forceIpv4Egress } = await import("./instrumentation-node");
  forceIpv4Egress();
}
