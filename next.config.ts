import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  transpilePackages: ["@excalidraw/excalidraw"],
};

export default nextConfig;
