import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Almost every page depends on the signed-in user, so pages render per request.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
