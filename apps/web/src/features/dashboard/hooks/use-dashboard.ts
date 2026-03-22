import { useQuery } from '@tanstack/react-query';
import { DashboardApi } from '../api/dashboard.api';

export function useSuperAdminStats() {
    return useQuery({
        queryKey: ['dashboard', 'super-stats'],
        queryFn: DashboardApi.getSuperAdminStats,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useInstitutionStats() {
    return useQuery({
        queryKey: ['dashboard', 'institution-stats'],
        queryFn: DashboardApi.getInstitutionStats,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}
