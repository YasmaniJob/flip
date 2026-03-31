'use client';

import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';
import { Grade } from './use-grades';
import { Section } from './use-sections';
import { CurricularArea } from './use-curricular-areas';
import { PedagogicalHour } from './use-pedagogical-hours';
import { Classroom } from '../../classrooms/hooks/use-classrooms';

export interface ConfigLoadout {
    grades: Grade[];
    sections: Section[];
    curricularAreas: CurricularArea[];
    pedagogicalHours: PedagogicalHour[];
    classrooms: Classroom[];
    defaults: any;
}

export function useConfigLoadout(options?: { enabled?: boolean }) {
    const api = useApiClient();
    return useQuery<ConfigLoadout>({
        queryKey: ['institution', 'config-loadout'],
        queryFn: () => api.get<ConfigLoadout>('/institution/config-loadout'),
        // Set very high stale time (12h) to rely on local device memory for free-tier savings
        staleTime: 12 * 60 * 60 * 1000, 
        gcTime: 24 * 60 * 60 * 1000,
        enabled: options?.enabled !== false, // Default true but allows conditional disabling
    });
}
