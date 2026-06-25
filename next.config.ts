import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next doesn't pick up an unrelated lockfile
  // higher up the filesystem.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
