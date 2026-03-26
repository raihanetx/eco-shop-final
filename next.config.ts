import type { NextConfig } from "next";
import { config } from 'dotenv';
import { resolve } from 'path';

// Force load .env file and override system environment
config({ path: resolve(__dirname, '.env'), override: true });

const nextConfig: NextConfig = {
  // Output mode - Vercel handles this automatically
  // Use 'standalone' only for Docker/self-hosted deployments
  // output: "standalone", // Uncomment for Docker deployment
  
  typescript: {
    // Production builds should fail on TypeScript errors
    ignoreBuildErrors: false,
  },
  
  reactStrictMode: true,
  
  // Allow dev requests from preview environments
  allowedDevOrigins: [
    '.space.z.ai',
    '.z.ai',
  ],
  
  // Vercel-specific: Enable Edge Runtime optimizations
  experimental: {
    // Enable optimized package imports for faster builds
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
  
  // Image Optimization - CRITICAL for speed
  images: {
    // SECURITY: Restrict image optimization to known sources
    // This prevents abuse of the image optimization API
    remotePatterns: [
      // Cloudinary (for user uploads)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // Placeholder images (development/fallback)
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      // Unsplash (for stock images)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Local development
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    // Image formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Image sizes for different use cases
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache TTL for optimized images
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Headers for static assets - SPEED optimization
  async headers() {
    return [
      {
        // Cache static assets for 1 year (immutable)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images for 30 days
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      // STATIC DATA API - Can be cached briefly (products, categories, settings, coupons)
      {
        source: '/api/products',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=5, stale-while-revalidate=30',
          },
        ],
      },
      {
        source: '/api/categories',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=10, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/api/settings',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=10, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/api/coupons',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=5, stale-while-revalidate=30',
          },
        ],
      },
      {
        source: '/api/shop-data',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=5, stale-while-revalidate=30',
          },
        ],
      },
      // DYNAMIC DATA API - No cache (orders, stock, reviews, customers)
      {
        source: '/api/orders',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      {
        source: '/api/inventory',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      {
        source: '/api/reviews',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      {
        source: '/api/customers',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      {
        source: '/api/abandoned',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      // SSE endpoint for Delta Sync - special headers for real-time connection
      {
        source: '/api/delta-sync',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-transform',
          },
          {
            key: 'Connection',
            value: 'keep-alive',
          },
          {
            key: 'X-Accel-Buffering',
            value: 'no',
          },
        ],
      },
      // Legacy SSE endpoint
      {
        source: '/api/realtime',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-transform',
          },
          {
            key: 'Connection',
            value: 'keep-alive',
          },
          {
            key: 'X-Accel-Buffering',
            value: 'no',
          },
        ],
      },
      // Default for other API routes
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

