"use client";

import { Pencil, Trash2, Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryItem {
    id: string;
    internalId: string | null;
    name: string;
    brand: string | null;
    categoryName: string;
    status: string;
    serialNumber: string | null;
    model: string | null;
}

interface InventoryTableProps {
    items: InventoryItem[];
    onEdit?: (item: InventoryItem) => void;
    onDelete?: (item: InventoryItem) => void;
    onArchive?: (item: InventoryItem) => void;
    onRestore?: (item: InventoryItem) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    disponible: { 
        label: "DISPONIBLE", 
        className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
    },
    prestado: { 
        label: "PRESTADO", 
        className: "bg-blue-500/10 text-blue-600 border-blue-500/20" 
    },
    mantenimiento: { 
        label: "MANTENIMIENTO", 
        className: "bg-amber-500/10 text-amber-600 border-amber-500/20" 
    },
    baja: { 
        label: "BAJA", 
        className: "bg-rose-500/10 text-rose-600 border-rose-500/20" 
    },
};

const TH_CLASS = "px-6 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40";

// ─── Component ────────────────────────────────────────────────────────────────

export function InventoryTable({
    items,
    onEdit,
    onDelete,
    onArchive,
    onRestore,
}: InventoryTableProps) {
    return (
        <div className="bg-white border border-border rounded-md overflow-hidden shadow-none">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-muted/5 border-b border-border">
                            <th className={TH_CLASS}>ID Interno</th>
                            <th className={TH_CLASS}>Recurso</th>
                            <th className={TH_CLASS}>Categoría</th>
                            <th className={TH_CLASS}>Estado</th>
                            <th className={TH_CLASS}>S/N / Modelo</th>
                            <th className={cn(TH_CLASS, "text-right pr-5")}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
                                        No hay recursos registrados
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => {
                                const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.disponible;
                                
                                return (
                                    <tr
                                        key={item.id}
                                        className="group hover:bg-muted/5 transition-colors"
                                    >
                                        {/* ID Interno */}
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                                                {item.internalId || "N/A"}
                                            </span>
                                        </td>

                                        {/* Recurso (Nombre + Marca) */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-sm font-black text-foreground uppercase tracking-tight">
                                                    {item.name}
                                                </p>
                                                {item.brand && (
                                                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                                                        {item.brand}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Categoría */}
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground/60">
                                                {item.categoryName}
                                            </span>
                                        </td>

                                        {/* Estado */}
                                        <td className="px-6 py-4">
                                            <div className={cn(
                                                "inline-flex items-center px-3 py-1 border text-[9px] font-black uppercase tracking-[0.15em]",
                                                statusConfig.className
                                            )}>
                                                {statusConfig.label}
                                            </div>
                                        </td>

                                        {/* S/N / Modelo */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] font-mono font-black text-foreground/70 uppercase">
                                                    {item.serialNumber || "N/A"}
                                                </span>
                                                <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">
                                                    {item.model || "MODELO ESTÁNDAR"}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {item.status === 'baja' && onRestore ? (
                                                    <ActionButton
                                                        icon={<RotateCcw className="h-3.5 w-3.5" />}
                                                        title="Restaurar"
                                                        onClick={() => onRestore(item)}
                                                        variant="restore"
                                                    />
                                                ) : (
                                                    <>
                                                        {onArchive && (
                                                            <ActionButton
                                                                icon={<Archive className="h-3.5 w-3.5" />}
                                                                title="Archivar"
                                                                onClick={() => onArchive(item)}
                                                                variant="archive"
                                                            />
                                                        )}
                                                        {onEdit && (
                                                            <ActionButton
                                                                icon={<Pencil className="h-3.5 w-3.5" />}
                                                                title="Editar"
                                                                onClick={() => onEdit(item)}
                                                                variant="edit"
                                                            />
                                                        )}
                                                        {onDelete && (
                                                            <ActionButton
                                                                icon={<Trash2 className="h-3.5 w-3.5" />}
                                                                title="Eliminar"
                                                                onClick={() => onDelete(item)}
                                                                variant="delete"
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Action Button Component ──────────────────────────────────────────────────

interface ActionButtonProps {
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    variant: "edit" | "delete" | "archive" | "restore";
}

function ActionButton({ icon, title, onClick, variant }: ActionButtonProps) {
    const variantClasses = {
        edit: "hover:text-primary hover:bg-primary/5",
        delete: "hover:text-destructive hover:bg-rose-50",
        archive: "hover:text-amber-600 hover:bg-amber-50",
        restore: "hover:text-emerald-600 hover:bg-emerald-50",
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            title={title}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={cn(
                "h-8 w-8 border border-transparent hover:border-border text-muted-foreground transition-colors",
                variantClasses[variant]
            )}
        >
            {icon}
        </Button>
    );
}
