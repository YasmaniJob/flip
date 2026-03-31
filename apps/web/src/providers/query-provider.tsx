"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

// Create a singleton QueryClient with default options
function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Optimización: datos frescos por más tiempo
                staleTime: 5 * 60 * 1000, // 5 minutos - reduce re-fetching innecesario
                gcTime: 10 * 60 * 1000, // 10 minutos - mantiene cache más tiempo
                refetchOnWindowFocus: false, // Evita re-fetch al cambiar de pestaña
                refetchOnMount: false, // Evita re-fetch al montar si hay cache
                refetchOnReconnect: false, // Evita re-fetch al reconectar
                retry: 1,
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            },
            mutations: {
                retry: 1,
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
    if (typeof window === "undefined") {
        // Server: always make a new query client
        return makeQueryClient();
    } else {
        // Browser: make a new query client if we don't already have one
        if (!browserQueryClient) browserQueryClient = makeQueryClient();
        return browserQueryClient;
    }
}

export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => getQueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

// Export the query client for use in mutations outside of React components
export { getQueryClient as getQueryClient };
