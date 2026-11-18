/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Geolocation, camera and bluetooth are needed by the field workflow.
          { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(self), bluetooth=(self), microphone=()' },
        ],
      },
    ];
  },
};
export default nextConfig;
