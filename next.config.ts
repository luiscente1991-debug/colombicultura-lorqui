import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@netlify/database', '@netlify/blobs'],
};

export default nextConfig;
