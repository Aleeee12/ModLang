import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "149.28.11.32",
    "104.168.143.241",
    "modlang.qzz.io",
  ],
  devIndicators: false,
};

export default nextConfig;