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
};

export default nextConfig;
