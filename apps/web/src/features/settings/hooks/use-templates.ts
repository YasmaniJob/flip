import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api-client";
import { handleApiError, showSuccess } from "@/lib/error-handler";

export interface ResourceTemplate {
  id: string;
  institutionId: string;
  categoryId: string;
  name: string;
  icon: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateTemplateInput {
  categoryId: string;
  name: string;
  icon: string;
}

export interface UpdateTemplateInput {
  id: string;
  name: string;
  icon?: string;
}

// Fetch all templates (optionally filtered by category)
export function useTemplates(categoryId?: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: categoryId ? ["templates", categoryId] : ["templates"],
    queryFn: async () => {
      const url = categoryId
        ? `/resource-templates?categoryId=${categoryId}`
        : "/resource-templates";
      const response = await api.get<ResourceTemplate[]>(url);
      return response;
    },
  });
}

// Create template
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const api = useApiClient();

  return useMutation({
    mutationFn: async (data: CreateTemplateInput) => {
      return await api.post<ResourceTemplate>("/resource-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      showSuccess('Plantilla creada correctamente');
    },
    onError: (error) => {
      handleApiError(error, 'No se pudo crear la plantilla');
    },
  });
}

// Update template
export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const api = useApiClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateTemplateInput) => {
      return await api.put<ResourceTemplate>(
        `/resource-templates/${id}`,
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      showSuccess('Plantilla actualizada correctamente');
    },
    onError: (error) => {
      handleApiError(error, 'No se pudo actualizar la plantilla');
    },
  });
}

// Delete template
export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const api = useApiClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/resource-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      showSuccess('Plantilla eliminada correctamente');
    },
    onError: (error) => {
      handleApiError(error, 'No se pudo eliminar la plantilla');
    },
  });
}
