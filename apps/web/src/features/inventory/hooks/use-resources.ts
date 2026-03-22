import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';

export interface Resource {
    id: string;
    institutionId: string;
    name: string;
    status: string;
    condition: string;
    internalId?: string;
    serialNumber?: string;
    categoryId?: string;
    templateId?: string;
    brand?: string;
    model?: string;
    notes?: string;
    maintenanceProgress?: number;
    maintenanceState?: Record<string, any> | null;
    createdAt?: string;
}

export interface ResourceStats {
    total: number;
    disponible: number;
    prestado: number;
    mantenimiento: number;
    baja: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
        limit: number;
    };
}

// Query Keys
export const resourceKeys = {
    all: ['resources'] as const,
    list: (params?: any) => [...resourceKeys.all, 'list', params] as const,
    stats: () => [...resourceKeys.all, 'stats'] as const,
    detail: (id: string) => [...resourceKeys.all, 'detail', id] as const,
};

// Hooks
export function useResources(params?: { search?: string, categoryId?: string, page?: number, limit?: number }) {
    const api = useApiClient();

    return useQuery({
        queryKey: resourceKeys.list(params),
        queryFn: async () => {
            const queryParams = new URLSearchParams();
            if (params?.search) queryParams.append('search', params.search);
            if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
            if (params?.page) queryParams.append('page', params.page.toString());
            if (params?.limit) queryParams.append('limit', params.limit.toString());

            const queryString = queryParams.toString();
            const response = await api.get<any>(`/resources${queryString ? `?${queryString}` : ''}`);
            return Array.isArray(response) ? response : response.data || [];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useResourceStats() {
    const api = useApiClient();

    return useQuery({
        queryKey: resourceKeys.stats(),
        queryFn: () => api.get<ResourceStats>('/resources/stats'),
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreateResource() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (data: any) => api.post<Resource>('/resources', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: resourceKeys.all });
        },
    });
}

export function useCreateBatchResources() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (data: {
            resource: any;
            quantity: number;
            items?: { serialNumber?: string; condition?: string; status?: string }[];
        }) => api.post<Resource[]>('/resources/batch', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: resourceKeys.all });
        },
    });
}

export function useTemplates(categoryId?: string) {
    const api = useApiClient();

    return useQuery({
        queryKey: ['templates', categoryId],
        queryFn: async () => {
            if (!categoryId) return [];
            const response = await api.get<PaginatedResponse<any>>(`/resource-templates?categoryId=${categoryId}&limit=100`);
            return response.data;
        },
        enabled: !!categoryId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreateTemplate() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (data: { categoryId: string; name: string; icon?: string }) =>
            api.post<any>('/resource-templates', data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['templates', variables.categoryId] });
        },
    });
}
