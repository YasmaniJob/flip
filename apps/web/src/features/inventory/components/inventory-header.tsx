"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

interface Resource {
    status: string;
}

interface InventoryHeaderProps {
    onAddResource?: () => void;
    resources: Resource[];
}

export function InventoryHeader({ onAddResource, resources }: InventoryHeaderProps) {
    const stats = useMemo(() => {
        return resources.reduce((acc, r) => ({
            total: acc.total + 1,
            available: acc.available + (r.status === 'disponible' ? 1 : 0),
            borrowed: acc.borrowed + (r.status === 'prestado' ? 1 : 0),
            maintenance: acc.maintenance + (r.status === 'mantenimiento' ? 1 : 0),
            retired: acc.retired + (r.status === 'baja' ? 1 : 0),
        }), { total: 0, available: 0, borrowed: 0, maintenance: 0, retired: 0 });
    }, [resources]);

    const total = stats.total;
    const availablePercent = total > 0 ? (stats.available / total) * 100 : 0;
    const borrowedPercent = total > 0 ? (stats.borrowed / total) * 100 : 0;
    const maintenancePercent = total > 0 ? (stats.maintenance / total) * 100 : 0;
    const retiredPercent = total > 0 ? (stats.retired / total) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase">
                        Inventario
                    </h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" className="h-10 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all">
                        Exportar
                    </Button>
                    {onAddResource && (
                        <Button 
                            variant="jira" 
                            onClick={onAddResource} 
                            className="h-10 px-6 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-none"
                        >
                            <Plus className="h-3.5 w-3.5 mr-2" />
                            Nuevo Recurso
                        </Button>
                    )}
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-stretch bg-card border border-border rounded-lg overflow-hidden shadow-none">
                {/* Left Side: Stats */}
                <div className="px-8 py-6 flex flex-col justify-center min-w-[260px] border-b md:border-b-0 md:border-r border-border bg-muted/5">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">
                        Unidades Físicas
                    </span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-foreground tracking-tighter tabular-nums">{total}</span>
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Registradas</span>
                    </div>
                </div>

                {/* Right Side: Progress Bar */}
                <div className="flex-1 px-10 py-6 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-xl font-black text-foreground tracking-tighter tabular-nums">{total}</span>
                        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Recursos Mapeados</span>
                    </div>
                    
                    <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden flex gap-0.5 mb-5 shadow-none">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-700"
                            style={{ width: `${availablePercent}%` }}
                        />
                        <div
                            className="h-full bg-blue-500 transition-all duration-700"
                            style={{ width: `${borrowedPercent}%` }}
                        />
                        <div
                            className="h-full bg-amber-500 transition-all duration-700"
                            style={{ width: `${maintenancePercent}%` }}
                        />
                        <div
                            className="h-full bg-rose-500 transition-all duration-700"
                            style={{ width: `${retiredPercent}%` }}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                        <div className="flex items-center gap-2.5">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Disp: <span className="text-foreground">{stats.available}</span></span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pres: <span className="text-foreground">{stats.borrowed}</span></span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="h-2 w-2 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Mant: <span className="text-foreground">{stats.maintenance}</span></span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="h-2 w-2 rounded-full bg-rose-500" />
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Baja: <span className="text-foreground">{stats.retired}</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
