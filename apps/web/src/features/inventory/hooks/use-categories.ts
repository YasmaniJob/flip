import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';
import { handleApiError, showSuccess } from '@/lib/error-handler';

export interface Category {
    id: string;
    institutionId: string;
    name: string;
    icon: string | null;
    color: string | null;
}

export interface CreateCategoryData {
    name: string;
    icon?: string;
    color?: string;
}

export interface UpdateCategoryData extends CreateCategoryData {
    id: string;
}

// Query Keys
export const categoryKeys = {
    all: ['categories'] as const,
    list: () => [...categoryKeys.all] as const,
    detail: (id: string) => [...categoryKeys.all, id] as const,
};

// Hooks
export function useCategories(options?: { hasResources?: boolean }) {
    const api = useApiClient();

    return useQuery({
        queryKey: [...categoryKeys.list(), options],
        queryFn: () => {
            const queryParams = new URLSearchParams();
            if (options?.hasResources) {
                queryParams.append('has_resources', 'true');
            }
            const queryString = queryParams.toString();
            const url = `/categories${queryString ? `?${queryString}` : ''}`;
            return api.get<Category[]>(url);
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (data: CreateCategoryData) => api.post<Category>('/categories', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.all });
            showSuccess('Categoría creada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo crear la categoría');
            queryClient.invalidateQueries({ queryKey: categoryKeys.all });
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (data: UpdateCategoryData) => {
            const { id, ...rest } = data;
            return api.put<Category>(`/categories/${id}`, rest);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.all });
            showSuccess('Categoría actualizada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo actualizar la categoría');
            queryClient.invalidateQueries({ queryKey: categoryKeys.all });
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<boolean>(`/categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.all });
            showSuccess('Categoría eliminada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo eliminar la categoría');
            queryClient.invalidateQueries({ queryKey: categoryKeys.all });
        },
    });
}

/**
 * Importa múltiples categorías estándar en un solo disparo.
 * Recibe un array de nombres y las crea con icon/color vacíos
 * (el usuario puede editarlas después).
 */
export function useSeedCategories() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: async (names: string[]) => {
            // Creamos todas en paralelo; si una falla no detenemos las demás
            const results = await Promise.allSettled(
                names.map(name => api.post<Category>('/categories', { name })),
            );
            const failed = results.filter(r => r.status === 'rejected');
            if (failed.length > 0) {
                console.warn(`${failed.length} categorías no pudieron importarse.`);
            }
            return results
                .filter((r): r is PromiseFulfilledResult<Category> => r.status === 'fulfilled')
                .map(r => r.value);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.all });
            showSuccess(`${data.length} categorías importadas correctamente`);
        },
        onError: (error) => {
            handleApiError(error, 'No se pudieron importar las categorías');
            queryClient.invalidateQueries({ queryKey: categoryKeys.all });
        },
    });
}
