import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
    // Provide absolute URL for SSR to prevent Node.js relative fetch 500 error
    baseURL: typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
});

export const {
    signIn,
    signUp,
    signOut,
    useSession,
} = authClient;
