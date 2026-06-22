import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["shared-ui", "@oak-commerce/types"],
};

export default nextConfig;
