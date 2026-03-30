'use client';

import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';
import { Grade } from './use-grades';
import { Section } from './use-sections';
import { CurricularArea } from './use-curricular-areas';
import { PedagogicalHour } from './use-pedagogical-hours';

export interface ConfigLoadout {
    grades: Grade[];
    sections: Section[];
    curricularAreas: CurricularArea[];
    pedagogicalHours: PedagogicalHour[];
}

export function useConfigLoadout() {
    const api = useApiClient();
    return useQuery<ConfigLoadout>({
        queryKey: ['institution', 'config-loadout'],
        queryFn: () => api.get<ConfigLoadout>('/institution/config-loadout'),
        staleTime: 10 * 60 * 1000, // 10 minutes — these values are very stable
        gcTime: 30 * 60 * 1000,    // Keep in memory for 30 minutes
    });
}
