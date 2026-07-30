import type { NextConfig } from "next"

const isVercel = process.env.VERCEL === "1"
const isTermux = !isVercel && (process.platform === "android" || process.env.HOME?.includes("/data/data/com.termux"))

// Force WASM SWC on Termux (no native binary for android/arm64)
if (isTermux) {
  process.env.NEXT_SWC_USE_WASM = "1"
}

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_IS_VERCEL: isVercel ? "true" : "false",
    NEXT_PUBLIC_IS_TERMUX: isTermux ? "true" : "false",
  },
  // Output file tracing root to handle workspace lockfile warning
  outputFileTracingRoot: process.cwd(),
  // Use webpack instead of Turbopack (Turbopack requires native bindings, not WASM)
  webpack: (config) => {
    return config
  },
}

export default nextConfig
