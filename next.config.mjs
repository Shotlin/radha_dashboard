/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development';

// In production: strict CSP. In development: relax script-src so Next.js
// hot-reload (inline scripts + eval via React Fast Refresh) can work.
const csp = [
  "default-src 'self'",
  `connect-src 'self' http://localhost:3000 http://localhost:3001 https://*.amazonaws.com https://*.cloudfront.net${isDev ? " ws://localhost:3001 ws://localhost:3000" : ""}`,
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://*.amazonaws.com https://*.cloudfront.net https://images.openfoodfacts.org https://static.openfoodfacts.org${isDev ? " http://localhost:*" : ""}`,
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Allow Razorpay checkout script
  "script-src-elem 'self' https://checkout.razorpay.com 'unsafe-inline'",
  "frame-src https://checkout.razorpay.com",
].join('; ');

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.openfoodfacts.org',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
