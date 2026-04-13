import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
  allowedDevOrigins: ["habit"],
};

export default nextConfig;
