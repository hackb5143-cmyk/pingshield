import type { NextConfig } from "next";
const nextConfig: NextConfig = { distDir: '.next-location', cacheComponents: false, experimental: { cpus: 2 } };
export default nextConfig;
