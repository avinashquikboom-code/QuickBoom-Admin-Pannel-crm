/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server build for Docker — copies only the deps actually
  // used at runtime into .next/standalone instead of shipping node_modules.
  output: 'standalone',
  agentRules: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'places.googleapis.com' },
      { protocol: 'https', hostname: 'maps.googleapis.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async rewrites() {
    return [{ source: '/hrm/:path*', destination: '/admin/hrm/:path*' }];
  },
};

module.exports = nextConfig;
