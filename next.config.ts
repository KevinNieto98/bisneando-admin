import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ❗ No falle el build por ESLint (solo en CI/producción)
    ignoreDuringBuilds: true,
  },

  /* config options here */
  devIndicators:false,
    experimental: {
    serverActions: {
      // acepta strings tipo '10mb', '20mb', etc.
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
