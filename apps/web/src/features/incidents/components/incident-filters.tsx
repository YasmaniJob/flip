"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IncidentPriority, IncidentStatus, IncidentType } from "../types";

interface IncidentFiltersProps {
  onFiltersChange: (filters: {
    search?: string;
    status?: IncidentStatus;
    priority?: IncidentPriority;
    type?: IncidentType;
  }) => void;
}

const statusOptions: { value: IncidentStatus; label: string }[] = [
  { value: "reportada", label: "Reportada" },
  { value: "en_revision", label: "En Revisión" },
  { value: "en_progreso", label: "En Progreso" },
  { value: "resuelta", label: "Resuelta" },
  { value: "cerrada", label: "Cerrada" },
];

const priorityOptions: { value: IncidentPriority; label: string }[] = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

const typeOptions: { value: IncidentType; label: string }[] = [
  { value: "recursos", label: "Recursos/Equipos" },
  { value: "infraestructura", label: "Infraestructura" },
  { value: "servicios", label: "Servicios" },
  { value: "seguridad", label: "Seguridad" },
  { value: "otros", label: "Otros" },
];

export function IncidentFilters({ onFiltersChange }: IncidentFiltersProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<IncidentStatus | "all">("all");
  const [priority, setPriority] = useState<IncidentPriority | "all">("all");
  const [type, setType] = useState<IncidentType | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    applyFilters({ search: value });
  };

  const handleStatusChange = (value: string) => {
    const newStatus = value === "all" ? "all" : (value as IncidentStatus);
    setStatus(newStatus);
    applyFilters({ status: newStatus });
  };

  const handlePriorityChange = (value: string) => {
    const newPriority = value === "all" ? "all" : (value as IncidentPriority);
    setPriority(newPriority);
    applyFilters({ priority: newPriority });
  };

  const handleTypeChange = (value: string) => {
    const newType = value === "all" ? "all" : (value as IncidentType);
    setType(newType);
    applyFilters({ type: newType });
  };

  const applyFilters = (updates: Partial<{
    search: string;
    status: IncidentStatus | "all";
    priority: IncidentPriority | "all";
    type: IncidentType | "all";
  }>) => {
    const currentFilters = {
      search: updates.search !== undefined ? updates.search : search,
      status: updates.status !== undefined ? updates.status : status,
      priority: updates.priority !== undefined ? updates.priority : priority,
      type: updates.type !== undefined ? updates.type : type,
    };

    onFiltersChange({
      search: currentFilters.search || undefined,
      status: currentFilters.status !== "all" ? currentFilters.status : undefined,
      priority: currentFilters.priority !== "all" ? currentFilters.priority : undefined,
      type: currentFilters.type !== "all" ? currentFilters.type : undefined,
    });
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setPriority("all");
    setType("all");
    onFiltersChange({});
  };

  const hasActiveFilters = search || status !== "all" || priority !== "all" || type !== "all";

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 z-10" />
          <Input
            type="search"
            placeholder="Buscar por título, descripción o ID..."
            className="pl-9 h-9 rounded-none border-border bg-background font-medium placeholder:text-muted-foreground/40 focus-visible:ring-primary"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="h-9 px-3 rounded-none border-border"
        >
          <Filter className="h-3.5 w-3.5 mr-2" />
          Filtros
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 px-3 rounded-none border border-border"
          >
            <X className="h-3.5 w-3.5 mr-2" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-card border border-border p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                Estado
              </Label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-9 rounded-none border-border">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                Prioridad
              </Label>
              <Select value={priority} onValueChange={handlePriorityChange}>
                <SelectTrigger className="h-9 rounded-none border-border">
                  <SelectValue placeholder="Todas las prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  {priorityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                Tipo
              </Label>
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger className="h-9 rounded-none border-border">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {typeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
