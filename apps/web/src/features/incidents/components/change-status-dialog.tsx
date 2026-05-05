"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChangeStatus } from "../hooks/use-incidents";
import { changeStatusSchema, type ChangeStatusInput } from "../schemas";
import { getValidNextStates } from "../services/state-machine-service";
import { toast } from "sonner";
import type { IncidentStatus } from "../types";

interface ChangeStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidentId: string;
  currentStatus: IncidentStatus;
}

const statusLabels: Record<IncidentStatus, string> = {
  reportada: "Reportada",
  en_revision: "En Revisión",
  en_progreso: "En Progreso",
  resuelta: "Resuelta",
  cerrada: "Cerrada",
};

export function ChangeStatusDialog({
  open,
  onOpenChange,
  incidentId,
  currentStatus,
}: ChangeStatusDialogProps) {
  const changeStatus = useChangeStatus(incidentId);
  const validNextStates = getValidNextStates(currentStatus);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangeStatusInput>({
    resolver: zodResolver(changeStatusSchema),
  });

  const selectedStatus = watch("status");

  const onSubmit = async (data: ChangeStatusInput) => {
    try {
      await changeStatus.mutateAsync(data);
      toast.success("Estado actualizado correctamente");
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar el estado");
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] rounded-none border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-black uppercase tracking-tight">
            Cambiar Estado
          </DialogTitle>
          <DialogDescription>
            Estado actual: <span className="font-semibold">{statusLabels[currentStatus]}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* New Status */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
              Nuevo Estado <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setValue("status", value as IncidentStatus)}
            >
              <SelectTrigger className="h-10 rounded-none border-border">
                <SelectValue placeholder="Selecciona el nuevo estado" />
              </SelectTrigger>
              <SelectContent>
                {validNextStates.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-xs text-destructive">{errors.status.message}</p>
            )}
          </div>

          {/* Resolution Comment (required when status -> resuelta) */}
          {selectedStatus === "resuelta" && (
            <div className="space-y-2">
              <Label htmlFor="resolutionComment" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                Comentario de Resolución <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="resolutionComment"
                {...register("resolutionComment")}
                placeholder="Describe cómo se resolvió la incidencia..."
                className="min-h-[100px] rounded-none border-border resize-none"
              />
              {errors.resolutionComment && (
                <p className="text-xs text-destructive">{errors.resolutionComment.message}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="rounded-none border-border flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedStatus}
              className="rounded-none flex-1"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cambiar Estado
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
