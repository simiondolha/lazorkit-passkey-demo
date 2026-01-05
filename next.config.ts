import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // CSP: Restrict script sources, prevent inline scripts (except Next.js requires unsafe-inline for development)
          // In production, use nonce-based CSP for stricter security
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js hydration
              "style-src 'self' 'unsafe-inline'", // Required for Tailwind
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://api.devnet.solana.com https://portal.lazor.sh https://kora.devnet.lazorkit.com https://*.solana.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          // Prevent MIME type sniffing attacks
          { key: "X-DNS-Prefetch-Control", value: "on" },
          // Strict Transport Security (enable HTTPS)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
