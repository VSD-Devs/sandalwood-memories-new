/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable compression (handled automatically by Next.js, but explicit for clarity)
  compress: true,
  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  webpack: (config, { isServer }) => {
    // Optimize bundle splitting
    if (!isServer) {
      // Ensure splitChunks is properly configured
      if (!config.optimization.splitChunks) {
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {}
        }
      } else if (config.optimization.splitChunks === false) {
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {}
        }
      }

      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        // Separate chunk for memorial components
        memorial: {
          test: /[\\/]components[\\/]memorial[\\/]/,
          name: 'memorial-components',
          chunks: 'all',
          priority: 10,
        },
        // Separate chunk for media components
        media: {
          test: /[\\/]components[\\/](media-gallery|lazy-image|lazy-video|media-upload)[\\/]/,
          name: 'media-components',
          chunks: 'all',
          priority: 10,
        },
        // Separate chunk for tribute components
        tributes: {
          test: /[\\/]components[\\/]tributes[\\/]/,
          name: 'tribute-components',
          chunks: 'all',
          priority: 10,
        },
      }
    }

    return config
  },
}

export default nextConfig
