import type { NextConfig } from "next";

// Origins that may embed this site in an iframe. The WebZítra editor at
// app.webzitra.cz frames the live page so clients can edit content with
// a click-to-focus overlay; without this, Next's default X-Frame-Options:
// DENY (and Vercel's CSP frame-ancestors 'self') blocks the embed and
// Chrome shows "Tento obsah je blokován".
const FRAME_ANCESTORS = [
  "'self'",
  "https://app.webzitra.cz",
  "https://app.pageeo.ai",
  "http://localhost:3000",
  "http://localhost:3001",
].join(" ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Modern frame-ancestors directive (replaces the deprecated
          // X-Frame-Options ALLOW-FROM, which Chrome/Firefox never
          // implemented). Browsers honour this over X-Frame-Options
          // when both are present.
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${FRAME_ANCESTORS}`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
