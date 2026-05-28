import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // output: "standalone", // Support standalone server compilation for Docker containerization
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
