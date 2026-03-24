import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import { handleApiError, showSuccess } from "@/lib/error-handler";

export interface Category {
  id: string;
  institutionId: string;
  name: string;
  icon: string;
  color: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateCategoryInput {
  name: string;
  icon: string;
  color: string;
}

export interface UpdateCategoryInput {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

// Fetch all categories
export function useCategories() {
  const api = useApiClient();
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get<Category[]>("/categories");
      return response;
    },
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();
  const api = useApiClient();

  return useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      return await api.post<Category>("/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      showSuccess('Categoría creada correctamente');
    },
    onError: (error) => {
      handleApiError(error, 'No se pudo crear la categoría');
    },
  });
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const api = useApiClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateCategoryInput) => {
      return await api.put<Category>(`/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      showSuccess('Categoría actualizada correctamente');
    },
    onError: (error) => {
      handleApiError(error, 'No se pudo actualizar la categoría');
    },
  });
}

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const api = useApiClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      showSuccess('Categoría eliminada correctamente');
    },
    onError: (error) => {
      handleApiError(error, 'No se pudo eliminar la categoría');
    },
  });
}
