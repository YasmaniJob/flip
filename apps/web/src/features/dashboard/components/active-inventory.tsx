'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, AlertTriangle, MonitorSmartphone, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLoans } from '@/features/loans/hooks/use-loans';
import { useInstitutionStats } from '@/features/dashboard/hooks/use-dashboard';
import { formatDistanceToNow, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

interface InventoryAlert {
    id: string;
    resourceName: string;
    borrowerName: string;
    status: 'active' | 'overdue';
    dueDate: string | null;
    isOverdue: boolean;
}

export function ActiveInventory() {
    const router = useRouter();
    const { data: allLoans, isLoading: loansLoading } = useLoans(5);
    const { data: stats } = useInstitutionStats();

    const isLoading = loansLoading;
    const instStats = stats?.institution;

    // Filter to only active or overdue loans
    const activeAlerts = useMemo<InventoryAlert[]>(() => {
        if (!allLoans) return [];

        const filtered = allLoans.filter(loan => loan.status !== 'returned');

        return filtered.map(loan => {
            const isOverdue = loan.status === 'overdue' || (loan.returnDate ? isPast(new Date(loan.returnDate)) : false);
            const relativeDueDate = loan.returnDate
                ? formatDistanceToNow(new Date(loan.returnDate), { addSuffix: true, locale: es })
                : null;

            const resourceNames = loan.resourceNames || [];
            let displayResourceName = resourceNames[0] || 'Equipo(s)';
            if (resourceNames.length > 1) displayResourceName += ` y ${resourceNames.length - 1} más`;

            return {
                id: loan.id,
                resourceName: displayResourceName,
                borrowerName: loan.staffName || 'Usuario desconocido',
                status: (isOverdue ? 'overdue' : 'active') as 'overdue' | 'active',
                dueDate: relativeDueDate,
                isOverdue
            };
        }).sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue));
    }, [allLoans]);

    if (isLoading) {
        return (
            <div className="bg-muted/30 rounded-lg p-5 border border-border h-full flex flex-col items-center justify-center animate-pulse">
                <span className="text-sm text-muted-foreground">Cargando inventario...</span>
            </div>
        );
    }

    return (
        <div className="bg-card/40 rounded-lg p-5 border border-border/60 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {activeAlerts.filter(i => i.isOverdue).length > 0 && (
                        <span className="flex items-center gap-1.5 text-[10px] font-black px-2 py-1 rounded bg-destructive/10 text-destructive uppercase tracking-widest border border-destructive/20 animate-pulse">
                            <AlertTriangle className="h-3 w-3" /> {activeAlerts.filter(i => i.isOverdue).length} Alertas
                        </span>
                    )}
                </div>
            </div>

            {/* Quick Counts */}
            {instStats && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="rounded-lg border border-border bg-card p-3 text-center">
                        <span className="text-2xl font-black text-foreground">{instStats.availableResources}</span>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">Disponibles</p>
                    </div>
                    <div className={cn("rounded-lg border p-3 text-center", instStats.overdueLoans > 0 ? "border-destructive/30 bg-destructive/5" : "border-border bg-card")}>
                        <span className={cn("text-2xl font-black", instStats.overdueLoans > 0 ? "text-destructive" : "text-foreground")}>{instStats.overdueLoans}</span>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">Vencidos</p>
                    </div>
                </div>
            )}

            {/* Loan Alerts */}
            <div className="flex-1 overflow-y-auto space-y-2">
                {activeAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-4 text-center">
                        <div className="h-8 w-8 rounded-full bg-success/10 text-success flex items-center justify-center mb-2">
                            <Archive className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-foreground text-[13px]">Todo al día</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Equipos en su lugar.</p>
                    </div>
                ) : activeAlerts.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            "group bg-card/60 p-3 rounded-md border transition-all hover:bg-accent/40 cursor-pointer",
                            item.isOverdue ? 'border-destructive/30' : 'border-border/80'
                        )}
                        onClick={() => router.push(`/inventario`)}
                    >
                        <h4 className="text-sm font-semibold text-foreground truncate mb-1">{item.resourceName}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                            <MonitorSmartphone className="h-3.5 w-3.5 opacity-70" />
                            <span className="truncate">{item.borrowerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                                item.isOverdue
                                    ? "text-destructive bg-destructive/5 border-destructive/20"
                                    : "text-warning bg-warning/5 border-warning/20"
                            )}>
                                {item.isOverdue ? 'Vencido' : 'En préstamo'}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {item.dueDate ? (item.isOverdue ? `Debió devolver ${item.dueDate}` : `Devuelve ${item.dueDate}`) : 'Sin fecha'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
