import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/CortiTick",
  assetPrefix: "/CortiTick/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
