"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  AlertTriangle, 
  Calendar, 
  User, 
  Package, 
  MapPin,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IncidentDetailView, IncidentPriority, IncidentStatus } from "../types";

const priorityColors: Record<IncidentPriority, string> = {
  baja: "border-gray-300 bg-gray-50 text-gray-700",
  media: "border-yellow-300 bg-yellow-50 text-yellow-700",
  alta: "border-orange-300 bg-orange-50 text-orange-700",
  critica: "border-red-300 bg-red-50 text-red-700",
};

const statusColors: Record<IncidentStatus, string> = {
  reportada: "border-blue-300 bg-blue-50 text-blue-700",
  en_revision: "border-purple-300 bg-purple-50 text-purple-700",
  en_progreso: "border-yellow-300 bg-yellow-50 text-yellow-700",
  resuelta: "border-green-300 bg-green-50 text-green-700",
  cerrada: "border-gray-300 bg-gray-50 text-gray-700",
};

const statusLabels: Record<IncidentStatus, string> = {
  reportada: "Reportada",
  en_revision: "En Revisión",
  en_progreso: "En Progreso",
  resuelta: "Resuelta",
  cerrada: "Cerrada",
};

const priorityLabels: Record<IncidentPriority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};

const typeLabels: Record<string, string> = {
  recursos: "Recursos/Equipos",
  infraestructura: "Infraestructura",
  servicios: "Servicios",
  seguridad: "Seguridad",
  otros: "Otros",
};

interface IncidentDetailProps {
  incident: IncidentDetailView;
}

export function IncidentDetail({ incident }: IncidentDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-muted-foreground/60">
                {incident.displayId}
              </span>
              {incident.isRecurrent && (
                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border border-orange-300 bg-orange-50 text-orange-700">
                  Recurrente
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {incident.title}
            </h1>
          </div>

          <div className="flex gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border",
              priorityColors[incident.priority as IncidentPriority]
            )}>
              {incident.priority === 'critica' && <AlertTriangle className="h-3 w-3" />}
              {priorityLabels[incident.priority as IncidentPriority]}
            </span>
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border",
              statusColors[incident.status as IncidentStatus]
            )}>
              {incident.status === 'resuelta' && <CheckCircle2 className="h-3 w-3" />}
              {statusLabels[incident.status as IncidentStatus]}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-muted/30 border border-border p-4">
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {incident.description}
          </p>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reporter */}
        <div className="bg-card border border-border p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
            <User className="h-3.5 w-3.5" />
            Reportado por
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{incident.reporter.name}</p>
            <p className="text-xs text-muted-foreground">{incident.reporter.email}</p>
          </div>
        </div>

        {/* Assignee */}
        <div className="bg-card border border-border p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
            <User className="h-3.5 w-3.5" />
            Asignado a
          </div>
          <div>
            {incident.assignee ? (
              <>
                <p className="text-sm font-medium text-foreground">{incident.assignee.name}</p>
                <p className="text-xs text-muted-foreground">{incident.assignee.email}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground/60">Sin asignar</p>
            )}
          </div>
        </div>

        {/* Type */}
        <div className="bg-card border border-border p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
            <AlertTriangle className="h-3.5 w-3.5" />
            Tipo
          </div>
          <p className="text-sm font-medium text-foreground">
            {typeLabels[incident.type] || incident.type}
          </p>
        </div>

        {/* Created Date */}
        <div className="bg-card border border-border p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
            <Calendar className="h-3.5 w-3.5" />
            Fecha de Reporte
          </div>
          <p className="text-sm font-medium text-foreground">
            {format(new Date(incident.createdAt), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
          </p>
        </div>

        {/* Resource (if applicable) */}
        {incident.resource && (
          <div className="bg-card border border-border p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
              <Package className="h-3.5 w-3.5" />
              Recurso Afectado
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{incident.resource.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{incident.resource.internalId}</p>
            </div>
          </div>
        )}

        {/* Location (if applicable) */}
        {incident.location && (
          <div className="bg-card border border-border p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
              <MapPin className="h-3.5 w-3.5" />
              Ubicación
            </div>
            <p className="text-sm font-medium text-foreground">{incident.location}</p>
          </div>
        )}

        {/* Resolution Time (if resolved) */}
        {incident.resolvedAt && incident.resolutionTime && (
          <div className="bg-card border border-border p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
              <Clock className="h-3.5 w-3.5" />
              Tiempo de Resolución
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {Math.floor(incident.resolutionTime / 60)}h {incident.resolutionTime % 60}m
              </p>
              <p className="text-xs text-muted-foreground">
                Resuelta el {format(new Date(incident.resolvedAt), "d MMM yyyy, HH:mm", { locale: es })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
