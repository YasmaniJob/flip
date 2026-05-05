import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';

export type Institution = {
    id: string;
    name: string;
    slug: string;
    codigoModular: string | null;
    nivel: string | null;
    plan: string | null;
    subscriptionStatus: string | null;
    trialEndsAt: string | null;
    settings?: {
        brandColor?: string;
        logoUrl?: string;
        location?: {
            departamento?: string;
            provincia?: string;
            distrito?: string;
            direccion?: string;
        };
        features?: Record<string, any>;
    } | null;
    stats?: {
        totalStaff: number;
        totalResources: number;
        activeLoans: number;
        overdueLoans: number;
        weekReservations: number;
        totalMeetings: number;
    };
    createdAt: string | null;
};

// Query keys for cache invalidation
export const institutionKeys = {
    myInstitution: ['my-institution'] as const,
};

export function useMyInstitution(options?: { enabled?: boolean }) {
    const api = useApiClient();

    return useQuery<Institution>({
        queryKey: institutionKeys.myInstitution,
        queryFn: () => api.get<Institution>('/institutions/my-institution'),
        staleTime: 10 * 60 * 1000, // 10 minutes cache
        retry: 1,
        enabled: options?.enabled !== false, // Default to true, but allow disabling
    });
}
