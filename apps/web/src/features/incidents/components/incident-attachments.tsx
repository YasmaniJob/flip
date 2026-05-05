"use client";

import { useState } from "react";
import { Image as ImageIcon, Upload, X, Download, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttachments, useUploadAttachment, useDeleteAttachment } from "../hooks/use-attachments";
import { useSession } from "@/lib/auth-client";
import { canDeleteAttachment } from "../services/permissions-service";
import { toast } from "sonner";
import { ActionConfirm } from "@/components/molecules/action-confirm";
import Image from "next/image";

interface IncidentAttachmentsProps {
  incidentId: string;
  incident: any;
}

export function IncidentAttachments({ incidentId, incident }: IncidentAttachmentsProps) {
  const { data: session } = useSession();
  const { data: attachments, isLoading } = useAttachments(incidentId);
  const uploadAttachment = useUploadAttachment(incidentId);
  const deleteAttachment = useDeleteAttachment(incidentId);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Solo se permiten archivos JPEG, PNG y WebP");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo no debe superar los 5MB");
      return;
    }

    try {
      await uploadAttachment.mutateAsync(file);
      toast.success("Archivo subido correctamente");
      e.target.value = ""; // Reset input
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir el archivo");
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      await deleteAttachment.mutateAsync(attachmentId);
      toast.success("Archivo eliminado correctamente");
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar el archivo");
    }
  };

  const canUpload = attachments && attachments.length < 5;
  const canDelete = (attachment: any) => 
    session?.user && canDeleteAttachment(session.user, incident, attachment);

  if (isLoading) {
    return (
      <div className="bg-card border border-border p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30 mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
          Archivos Adjuntos ({attachments?.length || 0}/5)
        </h3>
        
        {canUpload && (
          <label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={uploadAttachment.isPending}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploadAttachment.isPending}
              className="rounded-none border-border"
              asChild
            >
              <span>
                {uploadAttachment.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5 mr-2" />
                )}
                Subir archivo
              </span>
            </Button>
          </label>
        )}
      </div>

      {!attachments || attachments.length === 0 ? (
        <div className="py-12 text-center">
          <div className="h-12 w-12 border border-dashed border-border flex items-center justify-center text-muted-foreground/30 mx-auto mb-4">
            <ImageIcon className="h-5 w-5" />
          </div>
          <p className="text-sm font-black text-foreground uppercase tracking-tight">
            Sin archivos adjuntos
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            No hay imágenes adjuntas a esta incidencia
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="group relative aspect-square border border-border bg-muted/20 overflow-hidden"
            >
              <Image
                src={attachment.storageUrl}
                alt={attachment.fileName}
                fill
                className="object-cover cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setSelectedImage(attachment.storageUrl)}
              />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(attachment.storageUrl, "_blank")}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                {canDelete(attachment) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirm(attachment.id)}
                    className="h-8 w-8 p-0 text-white hover:bg-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* File info */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-white text-[10px] truncate">
                {attachment.fileName}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedImage}
              alt="Attachment"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <ActionConfirm
          open={!!deleteConfirm}
          onOpenChange={(open) => !open && setDeleteConfirm(null)}
          title="¿Eliminar archivo?"
          description="Esta acción no se puede deshacer. El archivo será eliminado permanentemente."
          onConfirm={() => handleDelete(deleteConfirm)}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="destructive"
          isLoading={deleteAttachment.isPending}
        />
      )}
    </div>
  );
}
