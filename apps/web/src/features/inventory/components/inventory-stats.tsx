"use client";

import { RESOURCE_STATUS } from "@flip/shared";

interface InventoryStatsProps {
    resources: any[];
}

export function InventoryStats({ resources }: InventoryStatsProps) {
    const stats = {
        total: resources.length,
        available: resources.filter(r => r.status === RESOURCE_STATUS.DISPONIBLE).length,
        borrowed: resources.filter(r => r.status === RESOURCE_STATUS.PRESTADO).length,
        maintenance: resources.filter(r => r.status === RESOURCE_STATUS.MANTENIMIENTO).length,
        retired: resources.filter(r => r.status === RESOURCE_STATUS.BAJA).length,
    };

    const availablePercent = (stats.available / stats.total) * 100 || 0;
    const borrowedPercent = (stats.borrowed / stats.total) * 100 || 0;
    const maintenancePercent = (stats.maintenance / stats.total) * 100 || 0;
    const retiredPercent = (stats.retired / stats.total) * 100 || 0;

    return (
        <div className="flex flex-col md:flex-row items-stretch bg-card border border-border rounded-none mb-6 h-auto md:h-16 divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden">
            {/* Left: Total */}
            <div className="px-6 py-3 flex flex-col justify-center min-w-[140px]">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mb-1.5">Recursos</span>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black tracking-tighter leading-none">{stats.total}</span>
                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Global</span>
                </div>
            </div>

            {/* Middle: Sparkline Bar */}
            <div className="flex-1 px-8 py-4 flex flex-col justify-center min-w-[200px] bg-muted/20">
                <div className="h-2.5 w-full bg-muted/30 rounded-none overflow-hidden flex gap-[1px]">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${availablePercent}%` }}
                        title={`Disponible: ${stats.available}`}
                    />
                    <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${borrowedPercent}%` }}
                        title={`Prestado: ${stats.borrowed}`}
                    />
                    <div
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${maintenancePercent}%` }}
                        title={`Mantenimiento: ${stats.maintenance}`}
                    />
                    <div
                        className="h-full bg-rose-500 transition-all duration-500"
                        style={{ width: `${retiredPercent}%` }}
                        title={`Baja: ${stats.retired}`}
                    />
                </div>
            </div>

            {/* Right: Legend Chips */}
            <div className="px-6 py-3 flex items-center gap-6 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 shrink-0">
                    <div className="h-2 w-2 bg-emerald-500 rounded-none" />
                    <div className="flex flex-col leading-none">
                        <span className="text-sm font-black tracking-tighter">{stats.available}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">OK</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="h-2 w-2 bg-blue-500 rounded-none" />
                    <div className="flex flex-col leading-none">
                        <span className="text-sm font-black tracking-tighter">{stats.borrowed}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">OUT</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="h-2 w-2 bg-amber-500 rounded-none" />
                    <div className="flex flex-col leading-none">
                        <span className="text-sm font-black tracking-tighter">{stats.maintenance}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">FIX</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="h-2 w-2 bg-rose-500 rounded-none" />
                    <div className="flex flex-col leading-none">
                        <span className="text-sm font-black tracking-tighter">{stats.retired}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">OFF</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
