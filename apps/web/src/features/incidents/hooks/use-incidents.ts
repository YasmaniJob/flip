import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';
import type { 
  IncidentWithRelations, 
  IncidentDetailView,
  ListIncidentsQuery,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  ChangeStatusRequest,
  ChangePriorityRequest,
  AssignIncidentRequest,
} from '../types';

// Query keys
export const incidentKeys = {
  all: ['incidents'] as const,
  lists: () => [...incidentKeys.all, 'list'] as const,
  list: (institutionId: string, filters: ListIncidentsQuery) => 
    [...incidentKeys.lists(), institutionId, filters] as const,
  details: () => [...incidentKeys.all, 'detail'] as const,
  detail: (institutionId: string, incidentId: string) => 
    [...incidentKeys.details(), institutionId, incidentId] as const,
  stats: (institutionId: string) => 
    [...incidentKeys.all, 'stats', institutionId] as const,
};

// List incidents
export function useIncidents(filters: ListIncidentsQuery = {}) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: incidentKeys.list(session?.user?.institutionId || '', filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, String(v)));
          } else {
            params.append(key, String(value));
          }
        }
      });

      const response = await fetch(
        `/api/institutions/${session?.user?.institutionId}/incidents?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Error al cargar incidencias');
      }

      return response.json() as Promise<{
        data: IncidentWithRelations[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>;
    },
    enabled: !!session?.user?.institutionId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Get incident detail
export function useIncident(incidentId: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: incidentKeys.detail(session?.user?.institutionId || '', incidentId),
    queryFn: async () => {
      const response = await fetch(
        `/api/institutions/${session?.user?.institutionId}/incidents/${incidentId}`
      );

      if (!response.ok) {
        throw new Error('Error al cargar la incidencia');
      }

      return response.json() as Promise<IncidentDetailView>;
    },
    enabled: !!session?.user?.institutionId && !!incidentId,
  });
}

// Create incident
export function useCreateIncident() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateIncidentRequest) => {
      const response = await fetch(
        `/api/institutions/${session?.user?.institutionId}/incidents`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear la incidencia');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all incident lists
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
    },
  });
}

// Update incident
export function useUpdateIncident(incidentId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateIncidentRequest) => {
      const response = await fetch(
        `/api/institutions/${session?.user?.institutionId}/incidents/${incidentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar la incidencia');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate detail and lists
      queryClient.invalidateQueries({ 
        queryKey: incidentKeys.detail(session?.user?.institutionId || '', incidentId) 
      });
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
    },
  });
}

// Delete incident
export function useDeleteIncident() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incidentId: string) => {
      const response = await fetch(
        `/api/institutions/${session?.user?.institutionId}/incidents/${incidentId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar la incidencia');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all incident lists
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
    },
  });
}

// Change status
export function useChangeStatus(incidentId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ChangeStatusRequest) => {
      const response = await fetch(
        `/api/institutions/${session?.user?.institutionId}/incidents/${incidentId}/status`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cambiar el estado');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: incidentKeys.detail(session?.user?.institutionId || '', incidentId) 
      });
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
    },
  });
}

// Change priority
export function useChangePriority(incidentId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ChangePriorityRequest) => {
      const response = await fetch(
        `/api/institutions/${session?.user?.institutionId}/incidents/${incidentId}/priority`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cambiar la prioridad');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: incidentKeys.detail(session?.user?.institutionId || '', incidentId) 
      });
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
    },
  });
}

// Assign incident
export function useAssignIncident(incidentId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignIncidentRequest) => {
      const response = await fetch(
        `/api/institutions/${session?.user?.institutionId}/incidents/${incidentId}/assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al asignar la incidencia');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: incidentKeys.detail(session?.user?.institutionId || '', incidentId) 
      });
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
    },
  });
}
