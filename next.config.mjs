/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        // Single-character paths are reserved for HeyCatch channel
        // attribution links (e.g. heycatch.ai/x -> yoursite.com/x).
        // None of this app's routes are a single letter or digit, so
        // this doesn't shadow anything real.
        source: '/:l([a-z0-9])',
        destination: '/?utm_source=heycatch&utm_campaign=:l',
        permanent: false,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
