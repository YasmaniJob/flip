import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';
import { incidentKeys } from './use-incidents';
import type { CreateCommentRequest, UpdateCommentRequest } from '../schemas';

// Create comment
export function useCreateComment(incidentId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCommentRequest) => {
      const response = await fetch(
        `/api/institutions/${session?.user?.institutionId}/incidents/${incidentId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear el comentario');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate incident detail to refresh comments
      queryClient.invalidateQueries({
        queryKey: incidentKeys.detail(session?.user?.institutionId || '', incidentId),
      });
    },
  });
}

// Update comment
export function useUpdateComment(incidentId: string, commentId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCommentRequest) => {
      const response = await fetch(
        `/api/institutions/${session?.user?.institutionId}/incidents/${incidentId}/comments/${commentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar el comentario');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: incidentKeys.detail(session?.user?.institutionId || '', incidentId),
      });
    },
  });
}

// Delete comment
export function useDeleteComment(incidentId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(
        `/api/institutions/${session?.user?.institutionId}/incidents/${incidentId}/comments/${commentId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar el comentario');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: incidentKeys.detail(session?.user?.institutionId || '', incidentId),
      });
    },
  });
}
