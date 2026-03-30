import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';

export type Institution = {
    id: string;
    name: string;
    codigoModular: string;
    departamento: string;
    provincia: string;
    distrito: string;
    nivel: string;
    logo?: string;
    brandColor?: string;
    subscriptionStatus: 'trial' | 'active' | 'expired';
    trialEndsAt?: string;
    stats?: {
        totalStaff: number;
        totalResources: number;
        activeLoans: number;
        overdueLoans: number;
        weekReservations: number;
        totalMeetings: number;
    };
};

// Query keys for cache invalidation
export const institutionKeys = {
    myInstitution: ['my-institution'] as const,
};

export function useMyInstitution() {
    const api = useApiClient();

    return useQuery<Institution>({
        queryKey: institutionKeys.myInstitution,
        queryFn: () => api.get<Institution>('/institutions/my-institution'),
        staleTime: 10 * 60 * 1000, // 10 minutes cache
        retry: 1,
    });
}
