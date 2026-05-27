import type { NextConfig } from "next";

/**
 * Baseline security response headers applied to every route. We deliberately
 * keep this conservative — no Content-Security-Policy for now because Clerk's
 * embedded widgets, Razorpay's checkout.js, and Next.js' inline scripts would
 * each need explicit allowances and getting the policy wrong breaks the app.
 * Revisit before public launch (see docs/runbooks/security-headers.md).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
