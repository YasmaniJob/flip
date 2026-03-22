


import { Pencil, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface CategoryCardProps {
    id: string;
    name: string;
    icon: string | null;
    resourceCount: number;
    stats?: {
        available: number;
        borrowed: number;
        maintenance: number;
    };
    onClick?: () => void;
    onEdit?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
}



export function CategoryCard({
    name,
    icon,
    resourceCount,
    stats,
    onClick,
    onEdit,
    onDelete
}: CategoryCardProps) {
    const operationalCount = stats ? (stats.available + stats.borrowed) : 0;
    const availabilityRate = resourceCount > 0 ? (operationalCount / resourceCount) * 100 : 0;

    return (
        <div
            onClick={onClick}
            className="group relative cursor-pointer flex flex-col bg-card border border-border rounded-none transition-all duration-200 hover:border-primary/60 overflow-hidden"
        >
            {/* 1. Technical Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border">
                <div className="px-1.5 py-0.5 bg-background border border-border rounded-sm">
                    <span className="font-mono text-[9px] font-black tracking-widest text-muted-foreground/70 uppercase">
                        CT-DATA
                    </span>
                </div>

                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all transition-opacity">
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(e);
                            }}
                            className="h-6 w-6 rounded-none border border-transparent hover:border-border hover:bg-background text-muted-foreground hover:text-foreground"
                        >
                            <Pencil className="h-3 w-3" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(e);
                            }}
                            className="h-6 w-6 rounded-none border border-transparent hover:border-destructive/20 hover:bg-destructive/5 text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="p-5 flex flex-col flex-1">
                {/* Title and Icon */}
                <div className="flex justify-between items-start gap-4 mb-6">
                    <div className="space-y-1 flex-1 min-w-0">
                        <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.25em]">
                            Nomenclatura
                        </span>
                        <h3 className="text-lg font-black text-foreground leading-tight group-hover:text-primary transition-colors tracking-tighter uppercase font-heading truncate">
                            {name}
                        </h3>
                    </div>
                    <div className="w-10 h-10 rounded-none bg-background flex items-center justify-center text-xl border border-border shrink-0 grayscale group-hover:grayscale-0 transition-all">
                        {icon || '📦'}
                    </div>
                </div>

                {/* Technical Metrics Area */}
                <div className="mt-auto space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">Estado</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black tracking-tighter text-foreground">
                                    {stats?.available ?? '-'}
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">Activos</span>
                            </div>
                        </div>
                        <div className="space-y-1 text-right">
                            <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">Capacidad</span>
                            <div className="flex items-baseline justify-end gap-1">
                                <span className="text-xl font-black tracking-tighter text-muted-foreground">
                                    {resourceCount}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Industrial Progress Bar */}
                    <div className="space-y-1.5 pt-4 border-t border-border/40">
                        <div className="flex justify-between items-center px-0.5">
                            <span className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Disponibilidad</span>
                            <span className="text-[10px] font-mono font-bold text-foreground/70">{Math.round(availabilityRate)}%</span>
                        </div>
                        <div className="h-[3px] bg-muted/30 rounded-none overflow-hidden flex">
                            <div
                                className="h-full bg-primary transition-all duration-700 ease-in-out"
                                style={{ width: `${availabilityRate}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
