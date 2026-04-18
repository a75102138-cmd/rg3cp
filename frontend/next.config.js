/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
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

module.exports = nextConfig;
