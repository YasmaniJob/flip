"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, GitBranch, AlertTriangle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIncident, useDeleteIncident } from "@/features/incidents/hooks/use-incidents";
import { IncidentDetail } from "@/features/incidents/components/incident-detail";
import { IncidentComments } from "@/features/incidents/components/incident-comments";
import { IncidentChangeHistory } from "@/features/incidents/components/incident-change-history";
import { IncidentAttachments } from "@/features/incidents/components/incident-attachments";
import { ChangeStatusDialog } from "@/features/incidents/components/change-status-dialog";
import { AssignIncidentDialog } from "@/features/incidents/components/assign-incident-dialog";
import { ChangePriorityDialog } from "@/features/incidents/components/change-priority-dialog";
import { ActionConfirm } from "@/components/molecules/action-confirm";
import { useSession } from "@/lib/auth-client";
import { canDeleteIncident, canChangeStatus, canAssignIncident } from "@/features/incidents/services/permissions-service";
import { toast } from "sonner";

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { data: incident, isLoading } = useIncident(id);
  const deleteIncident = useDeleteIncident();
  
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteIncident.mutateAsync(id);
      toast.success("Incidencia eliminada correctamente");
      router.push("/incidencias");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar la incidencia");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted/50" />
          <div className="h-64 bg-muted/50" />
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
        <div className="text-center py-20">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">
            Incidencia no encontrada
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            La incidencia que buscas no existe o no tienes permisos para verla
          </p>
          <Button onClick={() => router.push("/incidencias")} variant="outline">
            Volver a Incidencias
          </Button>
        </div>
      </div>
    );
  }

  const canDelete = session?.user && canDeleteIncident(session.user);
  const canChangeStatusValue = session?.user && canChangeStatus(session.user, incident);
  const canAssign = session?.user && canAssignIncident(session.user);

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="rounded-none border border-border"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="flex gap-2">
          {canChangeStatusValue && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStatusDialog(true)}
              className="rounded-none border-border"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Cambiar Estado
            </Button>
          )}
          
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-none border-destructive/20 hover:bg-destructive/5 text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <IncidentDetail incident={incident} />

          {/* Tabs for Comments and History */}
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none border border-border h-9">
              <TabsTrigger 
                value="comments"
                className="rounded-none text-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Comentarios ({incident.comments?.length || 0})
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="rounded-none text-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Historial ({incident.changeHistory?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="mt-6">
              <IncidentComments 
                incidentId={id} 
                comments={incident.comments || []} 
              />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <IncidentChangeHistory history={incident.changeHistory || []} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-card border border-border p-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
              Acciones Rápidas
            </h3>
            
            {canChangeStatusValue && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatusDialog(true)}
                className="w-full rounded-none border-border justify-start"
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Cambiar Estado
              </Button>
            )}

            {/* TODO: Add more quick actions */}
            {canAssign && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAssignDialog(true)}
                className="w-full rounded-none border-border justify-start"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Asignar Usuario
              </Button>
            )}

            {canChangeStatusValue && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPriorityDialog(true)}
                className="w-full rounded-none border-border justify-start"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Cambiar Prioridad
              </Button>
            )}
          </div>

          {/* Attachments */}
          <IncidentAttachments incidentId={id} incident={incident} />
        </div>
      </div>

      {/* Dialogs */}
      {showStatusDialog && (
        <ChangeStatusDialog
          open={showStatusDialog}
          onOpenChange={setShowStatusDialog}
          incidentId={id}
          currentStatus={incident.status as any}
        />
      )}

      {showAssignDialog && (
        <AssignIncidentDialog
          open={showAssignDialog}
          onOpenChange={setShowAssignDialog}
          incidentId={id}
          currentAssigneeId={incident.assigneeId}
        />
      )}

      {showPriorityDialog && (
        <ChangePriorityDialog
          open={showPriorityDialog}
          onOpenChange={setShowPriorityDialog}
          incidentId={id}
          currentPriority={incident.priority as any}
        />
      )}

      {showDeleteConfirm && (
        <ActionConfirm
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="¿Eliminar incidencia?"
          description={`Estás por eliminar la incidencia "${incident.title}". Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="destructive"
          isLoading={deleteIncident.isPending}
        />
      )}
    </div>
  );
}
