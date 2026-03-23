import { Pencil, Trash2 } from 'lucide-react';
import { RESOURCE_STATUS } from '@flip/shared';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Resource {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    status: string | null;
    condition: string | null;
    stock: number | null;
    categoryId: string | null;
    serialNumber: string | null;
    internalId: string | null;
    createdAt: Date | null;
    notes: string | null;
    maintenanceProgress?: number;
    maintenanceState?: any;
    category?: { name: string };
}

interface ResourceCardProps {
    resource: Resource;
    onEdit: (resource: Resource) => void;
    onDelete: (resource: Resource) => void;
    onLoan?: (resource: Resource) => void;
    onFinishMaintenance?: (resource: Resource) => void;
}


export function ResourceCard({ resource, onEdit, onDelete, onLoan, onFinishMaintenance }: ResourceCardProps) {
    return (
        <div className="group relative flex flex-col bg-card border border-border rounded-none transition-all duration-200 hover:border-primary/60 overflow-hidden">
            {/* 1. Header: Technical ID and Status Tag */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="px-1.5 py-0.5 bg-background border border-border rounded-sm">
                        <span className="font-mono text-[11px] font-black tracking-tighter text-foreground/70">
                            ID: {resource.internalId || resource.id.slice(0, 4).toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className={cn(
                    "px-2 py-0.5 rounded-sm border text-[9px] font-black uppercase tracking-[0.15em]",
                    resource.status === RESOURCE_STATUS.DISPONIBLE && "bg-emerald-50 text-emerald-700 border-emerald-200/50",
                    resource.status === RESOURCE_STATUS.PRESTADO && "bg-blue-50 text-blue-700 border-blue-200/50",
                    resource.status === RESOURCE_STATUS.MANTENIMIENTO && "bg-amber-50 text-amber-700 border-amber-200/50",
                    resource.status === RESOURCE_STATUS.BAJA && "bg-rose-50 text-rose-700 border-rose-200/50"
                )}>
                    {resource.status}
                </div>
            </div>

            {/* 2. Main Content: Name and Category */}
            <div className="p-4 flex-1">
                <div className="mb-1">
                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
                        {resource.category?.name || 'Recurso'}
                    </span>
                    <h3 className="text-lg font-black text-foreground leading-tight tracking-tighter uppercase font-heading group-hover:text-primary transition-colors truncate">
                        {resource.name}
                    </h3>
                    {resource.brand && (
                        <p className="text-[11px] font-bold text-muted-foreground tracking-tight">
                            {resource.brand}
                        </p>
                    )}
                </div>

                {/* Technical Specs Grid */}
                <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-y-3 gap-x-4">
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Serial N.</span>
                        <p className="font-mono text-[11px] font-medium text-foreground truncate">
                            {resource.serialNumber || '---'}
                        </p>
                    </div>
                    <div className="space-y-0.5 text-right">
                        <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Modelo</span>
                        <p className="font-mono text-[11px] font-medium text-foreground truncate">
                            {resource.model || '---'}
                        </p>
                    </div>
                </div>

                {resource.status === RESOURCE_STATUS.MANTENIMIENTO && resource.maintenanceProgress !== undefined && (
                    <div className="mt-4 space-y-1.5 pt-4 border-t border-border/30">
                        <div className="flex justify-between items-center px-0.5">
                            <span className="text-[8px] font-black text-amber-600/80 uppercase tracking-[0.2em]">En Proceso</span>
                            <span className="text-[10px] font-mono font-bold text-amber-700">{resource.maintenanceProgress}%</span>
                        </div>
                        <div className="h-[2px] bg-amber-100 rounded-none overflow-hidden">
                            <div
                                className="h-full bg-amber-500 transition-all duration-700"
                                style={{ width: `${resource.maintenanceProgress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Footer: Actions with Industrial Hierarchy */}
            <div className="px-4 py-3 bg-muted/5 border-t border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(resource)}
                        className="h-8 w-8 rounded-none border border-transparent hover:border-border hover:bg-background text-muted-foreground hover:text-foreground"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(resource)}
                        className="h-8 w-8 rounded-none border border-transparent hover:border-destructive/20 hover:bg-destructive/5 text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <div className="flex gap-1">
                    {resource.status === RESOURCE_STATUS.MANTENIMIENTO ? (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => onFinishMaintenance?.(resource)}
                            className="bg-amber-600 hover:bg-amber-700 text-[10px] font-black tracking-widest uppercase h-8 px-3"
                        >
                            Finalizar
                        </Button>
                    ) : (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => onLoan?.(resource)}
                            disabled={resource.status === RESOURCE_STATUS.PRESTADO || resource.status === RESOURCE_STATUS.BAJA}
                            className="text-[10px] font-black tracking-widest uppercase h-8 px-4"
                        >
                            {resource.status === RESOURCE_STATUS.PRESTADO ? 'Prestado' : 'Prestar'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
