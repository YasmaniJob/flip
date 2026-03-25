import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

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

    // Make VERCEL_URL available to the server
    env: {
        VERCEL_URL: process.env.VERCEL_URL,
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
};

export default withPWA({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
    runtimeCaching: [
        {
            urlPattern: /^https?.*/,
            handler: "NetworkFirst",
            options: {
                cacheName: "offlineCache",
                expiration: {
                    maxEntries: 200,
                },
            },
        },
    ],
})(nextConfig);
