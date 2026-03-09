const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Turbopack infers root as ./app; set to directory containing package.json.
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "appiclean.com.ua",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://appiclean.com.ua",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
