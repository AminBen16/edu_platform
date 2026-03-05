/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  },
  // Ensure proper trailing slash handling
  trailingSlash: false,
  // Production optimizations
  poweredByHeader: false,
}

module.exports = nextConfig
