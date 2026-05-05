"use client";

import { useState, useEffect, useDeferredValue, memo } from "react";
import { Plus, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useIncidents } from "../hooks/use-incidents";
import { BulkActionsToolbar } from "./bulk-actions-toolbar";
import { cn } from "@/lib/utils";
import { 
  IncidentPriority, 
  IncidentStatus, 
  INCIDENT_PRIORITY_COLORS, 
  INCIDENT_STATUS_COLORS 
} from "../types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useSession } from "@/lib/auth-client";
import { canPerformBulkOperations } from "../services/permissions-service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IncidentListProps {
  filters?: {
    status?: IncidentStatus | IncidentStatus[];
    priority?: IncidentPriority | IncidentPriority[];
    type?: string | string[];
    assigneeId?: string;
    reporterId?: string;
    resourceId?: string;
    search?: string;
  };
  onIncidentClick?: (incidentId: string) => void;
  onCreateClick?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TH = "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60";

// Priority badge colors
const priorityColors: Record<IncidentPriority, string> = {
  baja: "border-gray-300 bg-gray-50 text-gray-700",
  media: "border-yellow-300 bg-yellow-50 text-yellow-700",
  alta: "border-orange-300 bg-orange-50 text-orange-700",
  critica: "border-red-300 bg-red-50 text-red-700",
};

// Status badge colors
const statusColors: Record<IncidentStatus, string> = {
  reportada: "border-blue-300 bg-blue-50 text-blue-700",
  en_revision: "border-purple-300 bg-purple-50 text-purple-700",
  en_progreso: "border-yellow-300 bg-yellow-50 text-yellow-700",
  resuelta: "border-green-300 bg-green-50 text-green-700",
  cerrada: "border-gray-300 bg-gray-50 text-gray-700",
};

// Status labels
const statusLabels: Record<IncidentStatus, string> = {
  reportada: "Reportada",
  en_revision: "En Revisión",
  en_progreso: "En Progreso",
  resuelta: "Resuelta",
  cerrada: "Cerrada",
};

// Priority labels
const priorityLabels: Record<IncidentPriority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};

// ─── Skeleton Component ───────────────────────────────────────────────────────

const TableSkeleton = memo(({ showCheckbox }: { showCheckbox?: boolean }) => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        {showCheckbox && (
          <td className="px-6 py-4">
            <div className="h-4 w-4 bg-muted/50" />
          </td>
        )}
        <td className="px-6 py-4">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted/50" />
            <div className="h-3 w-48 bg-muted/30" />
          </div>
        </td>
        <td className="px-6 py-4"><div className="h-6 w-16 bg-muted/50" /></td>
        <td className="px-6 py-4"><div className="h-6 w-20 bg-muted/50" /></td>
        <td className="px-6 py-4"><div className="h-3 w-32 bg-muted/50" /></td>
        <td className="px-6 py-4"><div className="h-3 w-24 bg-muted/50" /></td>
        <td className="px-6 py-4"><div className="h-3 w-20 bg-muted/50" /></td>
      </tr>
    ))}
  </>
));
TableSkeleton.displayName = "TableSkeleton";

// ─── Incident Row Component ───────────────────────────────────────────────────

interface IncidentRowProps {
  incident: any;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onClick: (incidentId: string) => void;
  showCheckbox: boolean;
}

const IncidentRow = memo(({ incident, isSelected, onToggleSelect, onClick, showCheckbox }: IncidentRowProps) => (
  <tr className="group hover:bg-muted/20 transition-colors">
    {showCheckbox && (
      <td className="px-6 py-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(incident.incident.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </td>
    )}
    <td 
      className="px-6 py-4 cursor-pointer"
      onClick={() => onClick(incident.incident.id)}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-black text-muted-foreground/60">
            {incident.incident.displayId}
          </span>
          {incident.incident.isRecurrent && (
            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border border-orange-300 bg-orange-50 text-orange-700">
              Recurrente
            </span>
          )}
        </div>
        <p className="text-sm font-bold text-foreground line-clamp-1">
          {incident.incident.title}
        </p>
        <p className="text-xs text-muted-foreground/70 line-clamp-1">
          {incident.incident.description}
        </p>
      </div>
    </td>
    <td className="px-6 py-4 cursor-pointer" onClick={() => onClick(incident.incident.id)}>
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-widest border",
        priorityColors[incident.incident.priority as IncidentPriority]
      )}>
        {incident.incident.priority === 'critica' && <AlertTriangle className="h-3 w-3" />}
        {priorityLabels[incident.incident.priority as IncidentPriority]}
      </span>
    </td>
    <td className="px-6 py-4 cursor-pointer" onClick={() => onClick(incident.incident.id)}>
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-widest border",
        statusColors[incident.incident.status as IncidentStatus]
      )}>
        {incident.incident.status === 'resuelta' && <CheckCircle2 className="h-3 w-3" />}
        {incident.incident.status === 'cerrada' && <XCircle className="h-3 w-3" />}
        {incident.incident.status === 'en_progreso' && <Clock className="h-3 w-3" />}
        {statusLabels[incident.incident.status as IncidentStatus]}
      </span>
    </td>
    <td className="px-6 py-4 cursor-pointer" onClick={() => onClick(incident.incident.id)}>
      <div className="text-xs">
        <p className="font-medium text-foreground">{incident.reporter?.name || "—"}</p>
        <p className="text-muted-foreground/60 text-[10px]">Reportó</p>
      </div>
    </td>
    <td className="px-6 py-4 cursor-pointer" onClick={() => onClick(incident.incident.id)}>
      <div className="text-xs">
        {incident.assignee ? (
          <>
            <p className="font-medium text-foreground">{incident.assignee.name}</p>
            <p className="text-muted-foreground/60 text-[10px]">Asignado</p>
          </>
        ) : (
          <span className="text-muted-foreground/40 text-xs">Sin asignar</span>
        )}
      </div>
    </td>
    <td className="px-6 py-4 cursor-pointer" onClick={() => onClick(incident.incident.id)}>
      <div className="text-xs text-muted-foreground/70">
        {format(new Date(incident.incident.createdAt), "d MMM yyyy", { locale: es })}
      </div>
    </td>
  </tr>
));
IncidentRow.displayName = "IncidentRow";

// ─── Component ────────────────────────────────────────────────────────────────

export function IncidentList({ 
  filters = {}, 
  onIncidentClick,
  onCreateClick 
}: IncidentListProps) {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Check if user can perform bulk operations
  const canBulk = session?.user && canPerformBulkOperations(session.user);

  // Reset page and selection when filters change
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [filters]);

  const { data, isLoading } = useIncidents({ 
    page, 
    limit: 20,
    ...filters,
  });

  const handleIncidentClick = (incidentId: string) => {
    if (onIncidentClick) {
      onIncidentClick(incidentId);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (!data?.data) return;
    
    const allIds = data.data.map((inc: any) => inc.incident.id);
    setSelectedIds(prev => 
      prev.length === allIds.length ? [] : allIds
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const allSelected = data?.data && selectedIds.length === data.data.length && data.data.length > 0;

  return (
    <div className="space-y-4">
      {/* Bulk Actions Toolbar */}
      {canBulk && (
        <BulkActionsToolbar 
          selectedIds={selectedIds} 
          onClearSelection={handleClearSelection}
        />
      )}

      {/* Table */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {canBulk && (
                  <th className="px-6 py-4 w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      disabled={!data?.data || data.data.length === 0}
                    />
                  </th>
                )}
                <th className={TH}>Incidencia</th>
                <th className={TH}>Prioridad</th>
                <th className={TH}>Estado</th>
                <th className={TH}>Reportado por</th>
                <th className={TH}>Asignado a</th>
                <th className={TH}>Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <TableSkeleton showCheckbox={canBulk} />
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={canBulk ? 7 : 6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-12 w-12 border border-dashed border-border flex items-center justify-center text-muted-foreground/30">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground uppercase tracking-tight">
                          Sin incidencias registradas
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          Comienza reportando la primera incidencia
                        </p>
                      </div>
                      {onCreateClick && (
                        <Button variant="outline" size="sm" onClick={onCreateClick}>
                          <Plus className="h-3.5 w-3.5 mr-2" />
                          Reportar incidencia
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data?.data?.map((incident: any) => (
                  <IncidentRow
                    key={incident.incident.id}
                    incident={incident}
                    isSelected={selectedIds.includes(incident.incident.id)}
                    onToggleSelect={handleToggleSelect}
                    onClick={handleIncidentClick}
                    showCheckbox={!!canBulk}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-card">
            <span className="text-xs text-muted-foreground/60 font-bold uppercase tracking-widest">
              Página{" "}
              <span className="text-foreground">{data.pagination.page}</span>
              {" "}de{" "}
              <span className="text-foreground">{data.pagination.totalPages}</span>
              {" "}·{" "}
              <span className="text-foreground">{data.pagination.total}</span>
              {" "}incidencias
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 px-3 rounded-none border border-border text-xs font-bold"
              >
                Anterior
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.pagination.totalPages}
                className="h-7 px-3 rounded-none border border-border text-xs font-bold"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
