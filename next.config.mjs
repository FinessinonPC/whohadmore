/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure the OG fonts ship with the on-demand per-puzzle share-card render.
  outputFileTracingIncludes: {
    "/play/[date]/opengraph-image": ["./app/Inter-Black.ttf", "./app/Inter-Bold.ttf"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "**.wikipedia.org",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://vitals.vercel-insights.com; img-src 'self' data: https://upload.wikimedia.org https://*.wikipedia.org; font-src 'self' data:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
