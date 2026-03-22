'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';

export interface AcademicDefaults {
    defaultClassroomId?: string;
    defaultShift?: 'morning' | 'afternoon';
    classroomId?: string;
    shift?: 'mañana' | 'tarde';
}

export function useAcademicDefaults() {
    const { data: session } = useSession();

    return useQuery<AcademicDefaults>({
        queryKey: ['user-settings', session?.user?.id],
        queryFn: async () => {
            const res = await fetch('/api/users/me/settings');
            if (!res.ok) return {};
            const data = await res.json();
            
            // Map the API names to the ones used in the UI
            return {
                ...data,
                classroomId: data.defaultClassroomId,
                shift: data.defaultShift === 'morning' ? 'mañana' : data.defaultShift === 'afternoon' ? 'tarde' : undefined
            };
        },
        enabled: !!session?.user?.id,
        staleTime: 5 * 60 * 1000,
    });
}
