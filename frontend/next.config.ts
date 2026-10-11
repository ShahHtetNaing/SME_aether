import type { NextConfig } from "next";

const apiOrigin =
  process.env.API_URL ??
  (process.env.VERCEL ? "https://aether-9snf.onrender.com" : "http://localhost:4000");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;
