import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore
  allowedDevOrigins: ["*.trycloudflare.com", "localhost:3000"],
};

export default nextConfig;
