"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChangePriority } from "../hooks/use-incidents";
import { toast } from "sonner";
import { IncidentPriority } from "../types";
import { cn } from "@/lib/utils";

interface ChangePriorityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidentId: string;
  currentPriority: IncidentPriority;
}

const priorityOptions: { value: IncidentPriority; label: string; color: string }[] = [
  { value: "baja", label: "Baja", color: "text-gray-700" },
  { value: "media", label: "Media", color: "text-yellow-700" },
  { value: "alta", label: "Alta", color: "text-orange-700" },
  { value: "critica", label: "Crítica", color: "text-red-700" },
];

export function ChangePriorityDialog({
  open,
  onOpenChange,
  incidentId,
  currentPriority,
}: ChangePriorityDialogProps) {
  const changePriority = useChangePriority(incidentId);
  const [priority, setPriority] = useState<IncidentPriority>(currentPriority);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (priority === currentPriority) {
      toast.info("La prioridad no ha cambiado");
      onOpenChange(false);
      return;
    }

    try {
      await changePriority.mutateAsync({ priority });
      toast.success("Prioridad actualizada correctamente");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al cambiar la prioridad"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-none border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Cambiar Prioridad
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground/70">
            Selecciona el nuevo nivel de prioridad para esta incidencia.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-xs font-bold uppercase tracking-widest">
              Prioridad
            </Label>
            
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as IncidentPriority)}
            >
              <SelectTrigger className="rounded-none border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.value === "critica" && (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-700" />
                      )}
                      <span className={cn("font-medium", option.color)}>
                        {option.label}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {priority === "critica" && (
              <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 p-2">
                ⚠️ Las incidencias críticas notificarán inmediatamente a todos los administradores.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={changePriority.isPending}
              className="rounded-none border-border"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={changePriority.isPending || priority === currentPriority}
              className="rounded-none"
            >
              {changePriority.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar Prioridad"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
