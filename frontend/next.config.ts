import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      /** Assets stockés sur Cloudinary (photos projets, documents, etc.) */
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
  async redirects() {
    return [
      { source: "/logbook", destination: "/journal", permanent: false },
      { source: "/logbook/timeline", destination: "/journal/timeline", permanent: false },
    ];
  },
};

export default nextConfig;
