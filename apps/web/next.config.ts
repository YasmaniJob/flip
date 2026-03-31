import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";
import { readFileSync } from "fs";
import { join } from "path";

// Leer versión del package.json
const packageJson = JSON.parse(
    readFileSync(join(__dirname, "package.json"), "utf-8")
);

const nextConfig: NextConfig = {
    // Enable React strict mode
    reactStrictMode: true,

    // Transpile shared packages
    transpilePackages: ["@flip/shared"],

    // Ignore ESLint and TypeScript errors during build (for Vercel deployment)
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },

    // Make VERCEL_URL and APP_VERSION available
    env: {
        VERCEL_URL: process.env.VERCEL_URL,
        NEXT_PUBLIC_APP_VERSION: packageJson.version,
    },

    // Compiler optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
    },

    // Experimental features
    experimental: {
        // Optimize package imports - reduce bundle size
        optimizePackageImports: [
            'lucide-react',
            'recharts',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
        ],
    },

    // Image optimization
    images: {
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 60 * 60 * 24 * 365, // 1 año
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },

    // Webpack optimizations
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Optimizar bundle splitting
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        default: false,
                        vendors: false,
                        // Vendor chunk para librerías grandes
                        vendor: {
                            name: 'vendor',
                            chunks: 'all',
                            test: /node_modules/,
                            priority: 20,
                        },
                        // Chunk separado para Recharts
                        recharts: {
                            name: 'recharts',
                            test: /[\\/]node_modules[\\/]recharts[\\/]/,
                            priority: 30,
                        },
                        // Chunk separado para React PDF
                        reactPdf: {
                            name: 'react-pdf',
                            test: /[\\/]node_modules[\\/]@react-pdf[\\/]/,
                            priority: 30,
                        },
                        // Chunk separado para XLSX
                        xlsx: {
                            name: 'xlsx',
                            test: /[\\/]node_modules[\\/]xlsx[\\/]/,
                            priority: 30,
                        },
                        // Chunk separado para Framer Motion
                        framerMotion: {
                            name: 'framer-motion',
                            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
                            priority: 30,
                        },
                        // Common chunk para código compartido
                        common: {
                            minChunks: 2,
                            priority: 10,
                            reuseExistingChunk: true,
                        },
                    },
                },
            };
        }
        return config;
    },

    // Proxy API requests to backend (fixes cross-origin cookie issues)
    // DISABLED: Now using Next.js API Routes instead of external backend
    // async rewrites() {
    //     const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
    //     // Remove /api/v1 if present in the URL to avoid double prefixing in rewrites
    //     const apiUrl = rawApiUrl.replace(/\/api\/v1\/?$/, '');
    //     return [
    //         {
    //             source: '/api/auth/:path*',
    //             destination: `${apiUrl}/api/auth/:path*`,
    //         },
    //         {
    //             source: '/api/v1/:path*',
    //             destination: `${apiUrl}/api/v1/:path*`,
    //         },
    //     ];
    // },

    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                    { key: 'X-DNS-Prefetch-Control', value: 'on' },
                ],
            },
            // Cache static assets aggressively
            {
                source: '/static/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
        ];
    },
};

export default withPWA({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    runtimeCaching: [
        {
            // Cache static assets aggressively
            urlPattern: /^https?.*\.(png|jpg|jpeg|svg|gif|webp|avif|ico|woff|woff2|ttf|eot)$/i,
            handler: "CacheFirst",
            options: {
                cacheName: "static-assets",
                expiration: {
                    maxEntries: 200, // Aumentado
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
                },
            },
        },
        {
            // Network first for API calls (don't cache authenticated endpoints)
            urlPattern: /^https?.*\/api\/diagnostic\/.*/i,
            handler: "NetworkFirst",
            options: {
                cacheName: "diagnostic-api",
                networkTimeoutSeconds: 10,
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 5 * 60, // 5 minutes
                },
            },
        },
        {
            // Don't cache authenticated API endpoints - always go to network
            urlPattern: /^https?.*\/api\/(institutions\/my-institution|users|staff|loans|reservations|meetings).*/i,
            handler: "NetworkOnly",
        },
        {
            // Cache other pages with network first strategy
            urlPattern: /^https?.*/,
            handler: "NetworkFirst",
            options: {
                cacheName: "pages-cache",
                networkTimeoutSeconds: 10,
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 24 * 60 * 60, // 24 hours
                },
            },
        },
    ],
})(nextConfig);
