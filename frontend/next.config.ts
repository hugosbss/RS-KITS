import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

// Build "desktop" (Electron): gera saída 100% estática (out/) servida localmente.
if (process.env.NEXT_DESKTOP === '1') {
  nextConfig.output = 'export';
  nextConfig.trailingSlash = true;
  nextConfig.images = { unoptimized: true };
} else {
  // Em desenvolvimento (next dev), o browser usa a mesma origem (//api) e o
  // pròprio Next repassa para o backend NestJS.
  nextConfig.rewrites = async () => [
    {
      source: '/api/:path*',
      destination: `${process.env.NEXT_PUBLIC_API_PROXY ?? 'http://localhost:3001'}/api/:path*`,
    },
  ];
}

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

export default pwaConfig(nextConfig);