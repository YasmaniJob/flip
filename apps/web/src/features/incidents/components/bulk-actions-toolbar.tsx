"use client";

import { useState } from "react";
import { GitBranch, AlertTriangle, UserPlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionConfirm } from "@/components/molecules/action-confirm";
import { useBulkChangeStatus, useBulkChangePriority, useBulkAssign } from "../hooks/use-bulk-operations";
import { IncidentStatus, IncidentPriority } from "../types";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";

interface BulkActionsToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
}

export function BulkActionsToolbar({ selectedIds, onClearSelection }: BulkActionsToolbarProps) {
  const { data: session } = useSession();
  const bulkChangeStatus = useBulkChangeStatus();
  const bulkChangePriority = useBulkChangePriority();
  const bulkAssign = useBulkAssign();

  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [showPriorityConfirm, setShowPriorityConfirm] = useState(false);
  const [showAssignConfirm, setShowAssignConfirm] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<IncidentPriority | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);

  const [staff, setStaff] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Fetch staff members
  useEffect(() => {
    if (session?.user?.institutionId) {
      setLoadingStaff(true);
      fetch(`/api/staff`)
        .then((res) => res.json())
        .then((data) => {
          setStaff(data.staff || []);
        })
        .catch((error) => {
          console.error("Error fetching staff:", error);
        })
        .finally(() => {
          setLoadingStaff(false);
        });
    }
  }, [session?.user?.institutionId]);

  const handleBulkStatus = async () => {
    if (!selectedStatus) return;

    try {
      const result = await bulkChangeStatus.mutateAsync({
        incidentIds: selectedIds,
        status: selectedStatus,
      });

      toast.success(
        `${result.success} incidencias actualizadas correctamente` +
          (result.failed > 0 ? `. ${result.failed} fallaron.` : "")
      );

      if (result.failed > 0) {
        console.log("Failed incidents:", result.results.failed);
      }

      onClearSelection();
      setShowStatusConfirm(false);
      setSelectedStatus(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar");
    }
  };

  const handleBulkPriority = async () => {
    if (!selectedPriority) return;

    try {
      const result = await bulkChangePriority.mutateAsync({
        incidentIds: selectedIds,
        priority: selectedPriority,
      });

      toast.success(
        `${result.success} incidencias actualizadas correctamente` +
          (result.failed > 0 ? `. ${result.failed} fallaron.` : "")
      );

      onClearSelection();
      setShowPriorityConfirm(false);
      setSelectedPriority(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar");
    }
  };

  const handleBulkAssign = async () => {
    try {
      const result = await bulkAssign.mutateAsync({
        incidentIds: selectedIds,
        assigneeId: selectedAssignee,
      });

      toast.success(
        `${result.success} incidencias asignadas correctamente` +
          (result.failed > 0 ? `. ${result.failed} fallaron.` : "")
      );

      onClearSelection();
      setShowAssignConfirm(false);
      setSelectedAssignee(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al asignar");
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="bg-primary/10 border border-primary/20 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-foreground">
            {selectedIds.length} incidencia{selectedIds.length !== 1 ? "s" : ""} seleccionada
            {selectedIds.length !== 1 ? "s" : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-7 px-2 rounded-none"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatusConfirm(true)}
            className="rounded-none border-border"
          >
            <GitBranch className="h-3.5 w-3.5 mr-2" />
            Cambiar Estado
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPriorityConfirm(true)}
            className="rounded-none border-border"
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-2" />
            Cambiar Prioridad
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAssignConfirm(true)}
            className="rounded-none border-border"
          >
            <UserPlus className="h-3.5 w-3.5 mr-2" />
            Asignar Usuario
          </Button>
        </div>
      </div>

      {/* Status Confirmation Dialog */}
      <ActionConfirm
        open={showStatusConfirm}
        onOpenChange={setShowStatusConfirm}
        title="Cambiar estado de múltiples incidencias"
        description={
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vas a cambiar el estado de {selectedIds.length} incidencia
              {selectedIds.length !== 1 ? "s" : ""}. Esta acción se aplicará a todas las
              incidencias seleccionadas que permitan la transición.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest">
                Nuevo Estado
              </label>
              <Select
                value={selectedStatus || ""}
                onValueChange={(value) => setSelectedStatus(value as IncidentStatus)}
              >
                <SelectTrigger className="rounded-none border-border">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-border">
                  <SelectItem value="reportada">Reportada</SelectItem>
                  <SelectItem value="en_revision">En Revisión</SelectItem>
                  <SelectItem value="en_progreso">En Progreso</SelectItem>
                  <SelectItem value="resuelta">Resuelta</SelectItem>
                  <SelectItem value="cerrada">Cerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        onConfirm={handleBulkStatus}
        confirmText="Aplicar Cambios"
        cancelText="Cancelar"
        isLoading={bulkChangeStatus.isPending}
        disabled={!selectedStatus}
      />

      {/* Priority Confirmation Dialog */}
      <ActionConfirm
        open={showPriorityConfirm}
        onOpenChange={setShowPriorityConfirm}
        title="Cambiar prioridad de múltiples incidencias"
        description={
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vas a cambiar la prioridad de {selectedIds.length} incidencia
              {selectedIds.length !== 1 ? "s" : ""}.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest">
                Nueva Prioridad
              </label>
              <Select
                value={selectedPriority || ""}
                onValueChange={(value) => setSelectedPriority(value as IncidentPriority)}
              >
                <SelectTrigger className="rounded-none border-border">
                  <SelectValue placeholder="Seleccionar prioridad" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-border">
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        onConfirm={handleBulkPriority}
        confirmText="Aplicar Cambios"
        cancelText="Cancelar"
        isLoading={bulkChangePriority.isPending}
        disabled={!selectedPriority}
      />

      {/* Assign Confirmation Dialog */}
      <ActionConfirm
        open={showAssignConfirm}
        onOpenChange={setShowAssignConfirm}
        title="Asignar múltiples incidencias"
        description={
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vas a asignar {selectedIds.length} incidencia
              {selectedIds.length !== 1 ? "s" : ""} a un usuario.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest">
                Usuario Asignado
              </label>
              {loadingStaff ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
                </div>
              ) : (
                <Select
                  value={selectedAssignee || "none"}
                  onValueChange={(value) =>
                    setSelectedAssignee(value === "none" ? null : value)
                  }
                >
                  <SelectTrigger className="rounded-none border-border">
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border">
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {staff.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.user?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        }
        onConfirm={handleBulkAssign}
        confirmText="Asignar"
        cancelText="Cancelar"
        isLoading={bulkAssign.isPending}
      />
    </>
  );
}
