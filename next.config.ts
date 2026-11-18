import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '2000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '2000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Proxy uploads ke backend Express hanya jika URL backend dikonfigurasi
  async rewrites() {
    const internalBackendUrl = process.env.BACKEND_INTERNAL_URL?.trim().replace(/\/+$/, '');
    const devExpressUrl =
      process.env.NODE_ENV === 'development'
        ? (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || '')
            .trim()
            .replace(/\/+$/, '')
        : '';
    const uploadProxyTarget = internalBackendUrl || devExpressUrl;

    if (!uploadProxyTarget) {
      return [];
    }

    return [
      {
        source: '/uploads/:path*',
        destination: `${uploadProxyTarget}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
