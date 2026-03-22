"use client";

import { Pencil, Trash2, Settings2 } from "lucide-react";
import { RESOURCE_STATUS } from "@flip/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Resource {
    id: string;
    name: string;
    status: string | null;
    categoryId: string | null;
    serialNumber: string | null;
    model: string | null;
    internalId: string | null;
    brand: string | null;
    condition: string | null;
    stock: number | null;
    notes: string | null;
    createdAt: Date | null;
    maintenanceProgress?: number;
    maintenanceState?: Record<string, unknown> | null;
}

interface Category {
    id: string;
    name: string;
}

interface ResourceTableProps {
    resources: Resource[];
    categories: Category[];
    selectedIds?: Set<string>;
    onSelect?: (id: string, multi: boolean) => void;
    onSelectAll?: () => void;
    onEdit?: (resource: Resource) => void;
    onDelete?: (resource: Resource) => void;
    onMaintenance?: (resource: Resource) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<string, string> = {
    [RESOURCE_STATUS.DISPONIBLE]:   "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    [RESOURCE_STATUS.PRESTADO]:     "bg-blue-500/10 text-blue-600 border-blue-500/20",
    [RESOURCE_STATUS.MANTENIMIENTO]:"bg-amber-500/10 text-amber-600 border-amber-500/20",
    [RESOURCE_STATUS.BAJA]:         "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

const TH = "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60";

// ─── Component ────────────────────────────────────────────────────────────────

export function ResourceTable({
    resources,
    categories,
    selectedIds = new Set(),
    onSelect,
    onSelectAll,
    onEdit,
    onDelete,
    onMaintenance,
}: ResourceTableProps) {
    const getCategoryName = (id: string | null) =>
        id ? (categories.find(c => c.id === id)?.name ?? "Sin Categoría") : "Sin Categoría";

    const hasSelection   = selectedIds.size > 0;
    const isAllSelected  = hasSelection && selectedIds.size === resources.length;
    const isSomeSelected = hasSelection && selectedIds.size < resources.length;

    return (
        <div className="bg-card border border-border overflow-hidden shadow-none">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted/30 border-b border-border">
                            <th className={cn(TH, "w-28 whitespace-nowrap pl-5")}>
                                {hasSelection ? (
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                                            onCheckedChange={onSelectAll}
                                            className="data-[state=checked]:bg-primary rounded-none shadow-none h-3.5 w-3.5"
                                        />
                                        <span>ITEM</span>
                                    </div>
                                ) : "ITEM"}
                            </th>
                            <th className={TH}>Recurso</th>
                            <th className={TH}>Categoría</th>
                            <th className={TH}>Estado</th>
                            <th className={TH}>S/N / Modelo</th>
                            {(onEdit || onDelete || onMaintenance) && <th className={cn(TH, "text-right pr-5")}>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {resources.map(resource => {
                            const isSelected  = selectedIds.has(resource.id);
                            const isAvailable = resource.status === RESOURCE_STATUS.DISPONIBLE;
                            const displayId   = resource.internalId?.replace(/\D/g, "")
                                             ?? resource.id.slice(0, 4).replace(/\D/g, "");

                            return (
                                <tr
                                    key={resource.id}
                                    onClick={(e) => {
                                        if (!isAvailable) return;
                                        if ((e.target as HTMLElement).closest("[data-action-col]")) return;
                                        onSelect?.(resource.id, e.shiftKey);
                                    }}
                                    className={cn(
                                        "group transition-colors select-none",
                                        isAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-75 bg-muted/5",
                                        isSelected && isAvailable ? "bg-primary/5" : isAvailable ? "hover:bg-muted/10" : ""
                                    )}
                                >
                                    {/* ID Badge — technical styling */}
                                    <td className="px-5 py-2.5" data-select-col>
                                        <div className={cn(
                                            "relative inline-flex items-center px-1.5 py-0.5 rounded-sm border transition-all duration-200",
                                            isSelected
                                                ? "bg-primary border-primary"
                                                : "bg-background border-border"
                                        )}>
                                            <span className={cn(
                                                "text-[9px] font-black tabular-nums tracking-widest",
                                                isSelected ? "text-primary-foreground" : "text-foreground/50"
                                            )}>
                                                {displayId}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Name */}
                                    <td className="px-5 py-2.5">
                                        <p className="text-[11px] font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">
                                            {resource.name}
                                        </p>
                                    </td>

                                    {/* Category */}
                                    <td className="px-5 py-2.5">
                                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
                                            {getCategoryName(resource.categoryId)}
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td className="px-5 py-2.5">
                                        <div className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded-none border text-[8px] font-black uppercase tracking-widest shadow-none",
                                            STATUS_CLASSES[resource.status ?? ""] ?? "bg-muted text-muted-foreground border-border"
                                        )}>
                                            {resource.status}
                                        </div>
                                    </td>

                                    {/* Serial / Model */}
                                    <td className="px-5 py-2.5">
                                        <div className="space-y-0 text-[10px]">
                                            <p className="font-mono font-bold text-foreground/50 tabular-nums">
                                                {resource.serialNumber ?? "N/A"}
                                            </p>
                                            <p className="font-black text-muted-foreground/30 uppercase tracking-widest text-[8px]">
                                                {resource.model ?? "Standar"}
                                            </p>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    {(onEdit || onDelete || onMaintenance) && (
                                        <td className="px-5 py-2.5 text-right" data-action-col>
                                            <div className="flex items-center justify-end gap-1">
                                                {onMaintenance && (
                                                    <ActionBtn title="Mantenimiento" onClick={() => onMaintenance(resource)} hoverClass="hover:text-amber-600 hover:bg-amber-50">
                                                        <Settings2 className="h-3.5 w-3.5" />
                                                    </ActionBtn>
                                                )}
                                                {onEdit && (
                                                    <ActionBtn title="Editar" onClick={() => onEdit(resource)} hoverClass="hover:text-primary hover:bg-primary/5">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </ActionBtn>
                                                )}
                                                {onDelete && (
                                                    <ActionBtn title="Eliminar" onClick={() => onDelete(resource)} hoverClass="hover:text-destructive hover:bg-rose-50">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </ActionBtn>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionBtn({
    children,
    title,
    onClick,
    disabled,
    hoverClass,
}: {
    children: React.ReactNode;
    title: string;
    onClick: () => void;
    disabled?: boolean;
    hoverClass: string;
}) {
    return (
        <Button
            variant="ghost"
            size="icon"
            title={title}
            disabled={disabled}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={cn(
                "h-8 w-8 rounded-none border border-transparent hover:border-border hover:bg-background text-muted-foreground",
                hoverClass
            )}
        >
            {children}
        </Button>
    );
}
