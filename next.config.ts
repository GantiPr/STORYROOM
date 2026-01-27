import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Set root to silence the lockfile warning
    root: process.cwd()
  }
};

export default nextConfig;
