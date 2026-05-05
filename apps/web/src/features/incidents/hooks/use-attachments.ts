import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";

interface Attachment {
  id: string;
  incidentId: string;
  uploadedBy: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  storageUrl: string;
  createdAt: string;
  uploadedByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Hook to fetch attachments for an incident
 */
export function useAttachments(incidentId: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["incidents", incidentId, "attachments"],
    queryFn: async () => {
      if (!session?.user?.institutionId) {
        throw new Error("No institution ID");
      }

      const res = await fetch(
        `/api/institutions/${session.user.institutionId}/incidents/${incidentId}/attachments`
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al cargar los archivos adjuntos");
      }

      return res.json() as Promise<Attachment[]>;
    },
    enabled: !!session?.user?.institutionId && !!incidentId,
  });
}

/**
 * Hook to upload an attachment
 */
export function useUploadAttachment(incidentId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!session?.user?.institutionId) {
        throw new Error("No institution ID");
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/api/institutions/${session.user.institutionId}/incidents/${incidentId}/attachments`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al subir el archivo");
      }

      return res.json() as Promise<Attachment>;
    },
    onSuccess: () => {
      // Invalidate attachments list
      queryClient.invalidateQueries({
        queryKey: ["incidents", incidentId, "attachments"],
      });
      // Invalidate incident detail (to update attachment count)
      queryClient.invalidateQueries({
        queryKey: ["incidents", incidentId],
      });
    },
  });
}

/**
 * Hook to delete an attachment
 */
export function useDeleteAttachment(incidentId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      if (!session?.user?.institutionId) {
        throw new Error("No institution ID");
      }

      const res = await fetch(
        `/api/institutions/${session.user.institutionId}/incidents/${incidentId}/attachments/${attachmentId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al eliminar el archivo");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate attachments list
      queryClient.invalidateQueries({
        queryKey: ["incidents", incidentId, "attachments"],
      });
      // Invalidate incident detail (to update attachment count)
      queryClient.invalidateQueries({
        queryKey: ["incidents", incidentId],
      });
    },
  });
}
