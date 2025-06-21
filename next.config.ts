import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['jwt-decode'],
  reactStrictMode: true,
};

export default nextConfig;
