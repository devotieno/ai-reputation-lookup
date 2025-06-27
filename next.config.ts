import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve these modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        http2: false,
        child_process: false,
        'node:events': false,
        'node:process': false,
        'node:stream': false,
        'node:util': false,
        'node:url': false,
        'node:buffer': false,
        'node:querystring': false,
        'node:path': false,
        'node:os': false,
        'node:crypto': false,
        'node:fs': false,
        'node:http': false,
        'node:https': false,
        'node:zlib': false,
      };
    }
    return config;
  },
  serverExternalPackages: ['firebase-admin', '@google-cloud/vision', '@google-cloud/firestore']
};

export default nextConfig;
