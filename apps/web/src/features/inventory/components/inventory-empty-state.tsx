"use client";

import { Plus, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InventoryEmptyStateProps {
    search?: string;
    statusFilter?: string;
    onResetFilters?: () => void;
    onCreateResource: () => void;
}

export function InventoryEmptyState({
    search,
    statusFilter,
    onResetFilters,
    onCreateResource
}: InventoryEmptyStateProps) {
    const isFiltered = search || statusFilter !== "all";

    return (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-50/20 border border-dashed border-border rounded-none text-center animate-in fade-in duration-500 shadow-none">
            <div className="w-20 h-20 rounded-none bg-white border border-border flex items-center justify-center mb-6 shadow-none">
                <PackageSearch className="h-8 w-8 text-muted-foreground/20" />
            </div>

            <h3 className="text-xl font-black uppercase tracking-tighter text-foreground mb-2">
                {isFiltered ? "Sin resultados" : "Inventario vacío"}
            </h3>

            <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest text-center max-w-xs mb-8">
                {isFiltered
                    ? "No encontramos recursos que coincidan con tu búsqueda. Prueba ajustando los filtros."
                    : "Aún no has registrado ningún recurso. Comienza creando el primero para gestionar tu institución."
                }
            </p>

            {isFiltered ? (
                <Button
                    variant="jiraOutline"
                    onClick={onResetFilters}
                    className="h-9 px-6 font-black uppercase tracking-widest text-[10px]"
                >
                    Limpiar Filtros
                </Button>
            ) : (
                <Button
                    onClick={onCreateResource}
                    variant="jira"
                    size="sm"
                    className="h-10 px-8 font-black uppercase tracking-widest text-[11px]"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Recurso
                </Button>
            )}
        </div>
    );
}
