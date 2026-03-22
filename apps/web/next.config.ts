import type { NextConfig } from "next";

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

export default nextConfig;
