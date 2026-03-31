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

    // Experimental features
    experimental: {
        // Enable Turbopack for faster builds
        // turbo: {},
    },

    // Image optimization
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
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
        ];
    },
};

export default withPWA({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    runtimeCaching: [
        {
            // Cache static assets
            urlPattern: /^https?.*\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/i,
            handler: "CacheFirst",
            options: {
                cacheName: "static-assets",
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
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
