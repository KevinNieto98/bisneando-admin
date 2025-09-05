import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
