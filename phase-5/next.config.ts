import type { NextConfig } from "next";

const config: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  outputFileTracingIncludes: {
    "/api/discovery": ["../Phase-1/data/discovery/**"],
    "/api/problem-definition": ["../phase-4/data/**"]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' http://localhost:3000 http://127.0.0.1:3000"
          }
        ]
      }
    ];
  }
};

export default config;
