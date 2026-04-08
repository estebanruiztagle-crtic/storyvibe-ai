/** @type {import('next').NextConfig} */
const webpack = require('webpack')

const nextConfig = {
  transpilePackages: ['@storyvibe/shared', '@storyvibe/supabase'],
  experimental: {
    optimizePackageImports: ['tldraw'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Strip the "node:" scheme so webpack's fallback can handle bare module names
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '')
        })
      )
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
