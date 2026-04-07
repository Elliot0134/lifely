/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

// next-pwa is disabled for now (incompatible with Next.js 16 Turbopack)
// TODO: migrate to @serwist/next when PWA support is needed
module.exports = nextConfig;
