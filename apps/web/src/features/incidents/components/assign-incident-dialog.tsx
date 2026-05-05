"use client";

import { useState, useEffect } from "react";
import { UserPlus, Loader2, X } from "lucide-react";
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
import { useAssignIncident } from "../hooks/use-incidents";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

interface AssignIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidentId: string;
  currentAssigneeId: string | null;
}

export function AssignIncidentDialog({
  open,
  onOpenChange,
  incidentId,
  currentAssigneeId,
}: AssignIncidentDialogProps) {
  const { data: session } = useSession();
  const assignIncident = useAssignIncident(incidentId);
  const [assigneeId, setAssigneeId] = useState<string | null>(currentAssigneeId);
  const [staff, setStaff] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Fetch staff members
  useEffect(() => {
    if (open && session?.user?.institutionId) {
      setLoadingStaff(true);
      fetch(`/api/staff`)
        .then((res) => res.json())
        .then((data) => {
          setStaff(data.staff || []);
        })
        .catch((error) => {
          console.error("Error fetching staff:", error);
          toast.error("Error al cargar el personal");
        })
        .finally(() => {
          setLoadingStaff(false);
        });
    }
  }, [open, session?.user?.institutionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await assignIncident.mutateAsync({ assigneeId });
      toast.success(
        assigneeId 
          ? "Usuario asignado correctamente" 
          : "Asignación removida correctamente"
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al asignar usuario"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-none border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Asignar Usuario
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground/70">
            Selecciona un usuario para asignar esta incidencia o déjalo vacío para desasignar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assignee" className="text-xs font-bold uppercase tracking-widest">
              Usuario Asignado
            </Label>
            
            {loadingStaff ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
              </div>
            ) : (
              <Select
                value={assigneeId || "none"}
                onValueChange={(value) => setAssigneeId(value === "none" ? null : value)}
              >
                <SelectTrigger className="rounded-none border-border">
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-border">
                  <SelectItem value="none" className="text-muted-foreground/60">
                    Sin asignar
                  </SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      <div className="flex flex-col">
                        <span className="font-medium">{member.user?.name}</span>
                        <span className="text-xs text-muted-foreground/60">
                          {member.user?.email}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assignIncident.isPending}
              className="rounded-none border-border"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={assignIncident.isPending || loadingStaff}
              className="rounded-none"
            >
              {assignIncident.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Asignando...
                </>
              ) : (
                "Asignar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
