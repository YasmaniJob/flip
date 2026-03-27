"use client";

import { useMemo, useState } from "react";
import { Package, CheckCircle2, CalendarHeart, Wrench, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Resource {
    status: string;
}

interface InventoryHeaderProps {
    resources: Resource[];
    statusFilter: string;
    onStatusFilterChange: (status: string) => void;
}

export function InventoryHeader({ resources, statusFilter, onStatusFilterChange }: InventoryHeaderProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const stats = useMemo(() => {
        return resources.reduce((acc, r) => ({
            total: acc.total + 1,
            available: acc.available + (r.status === 'disponible' ? 1 : 0),
            borrowed: acc.borrowed + (r.status === 'prestado' ? 1 : 0),
            maintenance: acc.maintenance + (r.status === 'mantenimiento' ? 1 : 0),
            retired: acc.retired + (r.status === 'baja' ? 1 : 0),
        }), { total: 0, available: 0, borrowed: 0, maintenance: 0, retired: 0 });
    }, [resources]);

    const handleCardClick = (filterValue: string) => {
        if (statusFilter === filterValue) {
            onStatusFilterChange("all"); // Reset if already selected
        } else {
            onStatusFilterChange(filterValue);
        }
    };

    const cards = [
        {
            id: 'all',
            title: 'Total Unidades',
            value: stats.total,
            icon: Package,
            colorClass: 'text-slate-700',
            bgClass: 'bg-slate-100',
            borderClass: 'border-border hover:bg-muted/30',
            activeClass: 'border-primary bg-primary/5',
        },
        {
            id: 'disponible',
            title: 'Disponibles',
            value: stats.available,
            icon: CheckCircle2,
            colorClass: 'text-emerald-600',
            bgClass: 'bg-emerald-50',
            borderClass: 'border-border hover:bg-muted/30',
            activeClass: 'border-emerald-500 bg-emerald-50/50',
        },
        {
            id: 'prestado',
            title: 'Prestados',
            value: stats.borrowed,
            icon: CalendarHeart,
            colorClass: 'text-blue-600',
            bgClass: 'bg-blue-50',
            borderClass: 'border-border hover:bg-muted/30',
            activeClass: 'border-blue-500 bg-blue-50/50',
        },
        {
            id: 'mantenimiento',
            title: 'En Taller',
            value: stats.maintenance,
            icon: Wrench,
            colorClass: 'text-amber-600',
            bgClass: 'bg-amber-50',
            borderClass: 'border-border hover:bg-muted/30',
            activeClass: 'border-amber-500 bg-amber-50/50',
        },
        {
            id: 'baja',
            title: 'De Baja',
            value: stats.retired,
            icon: XCircle,
            colorClass: 'text-rose-600',
            bgClass: 'bg-rose-50',
            borderClass: 'border-border hover:bg-muted/30',
            activeClass: 'border-rose-500 bg-rose-50/50',
        }
    ];

    return (
        <div className="pt-2 mb-1">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 cursor-pointer mb-3">
                {cards.map((card, index) => {
                    const isActive = statusFilter === card.id;
                    const Icon = card.icon;
                    
                    // Solo mostrar las primeras 2 en móvil si no está expandido
                    const hideOnMobile = !isExpanded && index >= 2;

                    return (
                        <div
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            className={cn(
                                "flex items-center justify-between p-4 sm:p-5 rounded-md border bg-card transition-colors duration-150 select-none shadow-none",
                                isActive ? card.activeClass : card.borderClass,
                                hideOnMobile ? "hidden md:flex" : "flex"
                            )}
                        >
                            <div className="flex flex-col gap-1">
                                <span className={cn(
                                    "text-3xl sm:text-4xl font-black tabular-nums tracking-tighter leading-none",
                                    isActive ? "text-foreground" : "text-slate-800"
                                )}>
                                    {card.value}
                                </span>
                                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                    {card.title}
                                </span>
                            </div>
                            <div className={cn(
                                "w-10 h-10 sm:w-12 sm:h-12 rounded-sm flex items-center justify-center shrink-0 transition-colors",
                                card.bgClass,
                                card.colorClass
                            )}>
                                <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Toggle Button for Mobile Expansion */}
            <div className="flex md:hidden justify-center mt-0 pb-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 hover:text-primary transition-all flex items-center gap-1.5 hover:bg-transparent"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? (
                        <>
                            Ver menos
                            <ChevronUp className="w-2.5 h-2.5 opacity-50" />
                        </>
                    ) : (
                        <>
                            Ver más detalle
                            <ChevronDown className="w-2.5 h-2.5 opacity-50" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
