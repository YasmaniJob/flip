import { useQuery } from '@tanstack/react-query';

export const institutionKeys = {
    myInstitution: ['my-institution'] as const,
};

async function fetchMyInstitution() {
    const res = await fetch('/api/institutions/my-institution');
    if (!res.ok) {
        if (res.status === 401) return null; // User has no institution
        throw new Error('Failed to fetch institution');
    }
    const data = await res.json();
    return data.data || data;
}

export function useMyInstitution() {
    return useQuery({
        queryKey: institutionKeys.myInstitution,
        queryFn: fetchMyInstitution,
        staleTime: 5 * 60 * 1000, // 5 minutes - data rarely changes
        gcTime: 10 * 60 * 1000, // 10 minutes in cache
        retry: 1,
    });
}
