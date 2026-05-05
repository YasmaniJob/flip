import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { IncidentStatus, IncidentPriority } from "../types";

interface BulkOperationResult {
  success: number;
  failed: number;
  results: {
    success: string[];
    failed: Array<{ id: string; reason: string }>;
  };
}

/**
 * Hook to change status of multiple incidents
 */
export function useBulkChangeStatus() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentIds,
      status,
    }: {
      incidentIds: string[];
      status: IncidentStatus;
    }) => {
      if (!session?.user?.institutionId) {
        throw new Error("No institution ID");
      }

      const res = await fetch(
        `/api/institutions/${session.user.institutionId}/incidents/bulk/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ incidentIds, status }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al cambiar el estado");
      }

      return res.json() as Promise<BulkOperationResult>;
    },
    onSuccess: () => {
      // Invalidate incidents list
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}

/**
 * Hook to change priority of multiple incidents
 */
export function useBulkChangePriority() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentIds,
      priority,
    }: {
      incidentIds: string[];
      priority: IncidentPriority;
    }) => {
      if (!session?.user?.institutionId) {
        throw new Error("No institution ID");
      }

      const res = await fetch(
        `/api/institutions/${session.user.institutionId}/incidents/bulk/priority`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ incidentIds, priority }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al cambiar la prioridad");
      }

      return res.json() as Promise<BulkOperationResult>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}

/**
 * Hook to assign multiple incidents to a user
 */
export function useBulkAssign() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      incidentIds,
      assigneeId,
    }: {
      incidentIds: string[];
      assigneeId: string | null;
    }) => {
      if (!session?.user?.institutionId) {
        throw new Error("No institution ID");
      }

      const res = await fetch(
        `/api/institutions/${session.user.institutionId}/incidents/bulk/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ incidentIds, assigneeId }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al asignar incidencias");
      }

      return res.json() as Promise<BulkOperationResult>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}
