import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

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
  return useQuery({
    queryKey: categoryId ? ['templates', categoryId] : ['templates'],
    queryFn: async () => {
      const url = categoryId 
        ? `/api/resource-templates?categoryId=${categoryId}`
        : '/api/resource-templates';
      const response = await apiClient.get<ResourceTemplate[]>(url);
      return response;
    },
  });
}

// Create template
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTemplateInput) => {
      return await apiClient.post<ResourceTemplate>('/api/resource-templates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

// Update template
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateTemplateInput) => {
      return await apiClient.put<ResourceTemplate>(`/api/resource-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

// Delete template
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/api/resource-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}
