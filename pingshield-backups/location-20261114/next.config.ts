import type { NextConfig } from "next";
const nextConfig: NextConfig = { cacheComponents: false, experimental: { cpus: 2 } };
export default nextConfig;
