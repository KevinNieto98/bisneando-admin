import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ❗ No falle el build por ESLint (solo en CI/producción)
    ignoreDuringBuilds: true,
  },
    images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zpvrlltzujenjqbjewni.supabase.co",
        pathname: "/storage/v1/object/public/imagenes_productos/**",
      },
    ],
    // Si quieres permitir más dominios luego, los agregas aquí
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
