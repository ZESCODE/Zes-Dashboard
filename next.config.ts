import type { NextConfig } from "next"

const isVercel = process.env.VERCEL === "1"
const isTermux = !isVercel && process.platform === "linux" && process.env.HOME?.includes("/data/data/com.termux")

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    qualities: [75, 90],
  },
  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_IS_VERCEL: isVercel ? "true" : "false",
    NEXT_PUBLIC_IS_TERMUX: isTermux ? "true" : "false",
  },
}

// Termux-specific webpack overrides (not needed on Vercel)
if (isTermux) {
  nextConfig.webpack = (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: [
        "**/node_modules/**",
        "/data/**",
        "/**",
      ],
    }
    config.cache = false
    return config
  }
}

export default nextConfig
