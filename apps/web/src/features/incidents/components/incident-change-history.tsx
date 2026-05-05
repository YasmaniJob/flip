"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { History, ArrowRight } from "lucide-react";
import type { IncidentChangeHistory } from "../types";

interface IncidentChangeHistoryProps {
  history: Array<IncidentChangeHistory & {
    changedByUser: {
      id: string;
      name: string;
    };
  }>;
}

const fieldLabels: Record<string, string> = {
  status: "Estado",
  priority: "Prioridad",
  assignee: "Asignado",
  type: "Tipo",
  title: "Título",
  description: "Descripción",
  resource: "Recurso",
  location: "Ubicación",
  isActive: "Activo",
};

const statusLabels: Record<string, string> = {
  reportada: "Reportada",
  en_revision: "En Revisión",
  en_progreso: "En Progreso",
  resuelta: "Resuelta",
  cerrada: "Cerrada",
};

const priorityLabels: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};

const changeTypeLabels: Record<string, string> = {
  created: "Creada",
  updated: "Actualizada",
  deleted: "Eliminada",
};

function formatValue(field: string, value: string | null): string {
  if (value === null) return "—";
  
  if (field === "status") {
    return statusLabels[value] || value;
  }
  
  if (field === "priority") {
    return priorityLabels[value] || value;
  }
  
  if (field === "isActive") {
    return value === "true" ? "Activo" : "Inactivo";
  }
  
  return value;
}

export function IncidentChangeHistory({ history }: IncidentChangeHistoryProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">
          Historial de Cambios ({history.length})
        </h2>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 border border-dashed border-border">
            <History className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground/60">
              No hay cambios registrados
            </p>
          </div>
        ) : (
          history.map((change, index) => (
            <div
              key={change.id}
              className="relative pl-8 pb-4 border-l-2 border-border last:border-l-0 last:pb-0"
            >
              {/* Timeline dot */}
              <div className="absolute left-0 top-0 -translate-x-[9px] h-4 w-4 rounded-full border-2 border-border bg-background flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>

              {/* Change content */}
              <div className="bg-card border border-border p-4 space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {change.changedByUser.name}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border border-border text-muted-foreground/60">
                        {changeTypeLabels[change.changeType] || change.changeType}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(change.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>

                {/* Change details */}
                <div className="pt-2">
                  {change.changeType === "created" ? (
                    <p className="text-sm text-foreground">
                      Incidencia creada
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                        {fieldLabels[change.field] || change.field}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          {formatValue(change.field, change.oldValue)}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
                        <span className="font-medium text-foreground">
                          {formatValue(change.field, change.newValue)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  {change.metadata && Object.keys(change.metadata).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        {JSON.stringify(change.metadata, null, 2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
