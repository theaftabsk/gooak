import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@oak-commerce/types"],
  async headers() {
    return [
      {
        // Allow the merchant dashboard (port 3000) to embed the storefront in an iframe
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self' http://localhost:3000 http://*.localhost:3000" },
        ],
      },
    ];
  },
};

export default nextConfig;
