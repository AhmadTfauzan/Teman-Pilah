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
  // Proxy uploads ke backend Express
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:2000/uploads/:path*',
      },
    ];
  },
  // Alias permanen untuk link pendek QR Code galon
  async redirects() {
    return [
      {
        source: '/b/:code',
        destination: '/eco-enzyme/batch/:code',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
