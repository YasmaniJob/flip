import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';

export interface DamageReport {
    loanId: string;
    reportDate: string;
    reportedBy: string;
    damages: string[];
    suggestions?: string[];
}

export function useLastDamageReport(resourceId: string | undefined) {
    const apiClient = useApiClient();

    return useQuery({
        queryKey: ['resource-damage-report', resourceId],
        queryFn: async () => {
            if (!resourceId) return null;
            try {
                const response = await apiClient.get<DamageReport>(`/resources/${resourceId}/last-damage-report`);
                return response;
            } catch (error) {
                // If 404 or empty, it means no meaningful damage history to show
                return null;
            }
        },
        enabled: !!resourceId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
