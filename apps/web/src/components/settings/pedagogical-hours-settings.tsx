'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    usePedagogicalHours,
    useCreatePedagogicalHour,
    useDeletePedagogicalHour,
    type PedagogicalHour,
} from '@/features/settings/hooks/use-pedagogical-hours';
import { Plus, Trash2, Loader2, AlertCircle, Sun, Moon } from 'lucide-react';
import { ActionConfirm } from '@/components/molecules/action-confirm';
import { cn } from '@/lib/utils';

export function PedagogicalHoursSettings() {
    const { data: hours = [], isLoading, isError, refetch } = usePedagogicalHours();
    const createMutation = useCreatePedagogicalHour();
    const deleteMutation = useDeletePedagogicalHour();

    // Delete confirmation
    const [deletingHour, setDeletingHour] = useState<PedagogicalHour | null>(null);

    const sortedHours = useMemo(() => 
        [...hours].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)), 
    [hours]);

    const morningHours = useMemo(() => 
        sortedHours.filter(h => h.startTime < '13:00'), 
    [sortedHours]);

    const afternoonHours = useMemo(() => 
        sortedHours.filter(h => h.startTime >= '13:00'), 
    [sortedHours]);

    const addHourByShift = async (shift: 'mañana' | 'tarde') => {
        const shiftHours = shift === 'mañana' ? morningHours : afternoonHours;
        const totalShiftCount = shiftHours.length;
        
        await createMutation.mutateAsync({
            name: `${totalShiftCount + 1}° Hora`,
            startTime: shift === 'mañana' ? '08:00' : '13:00',
            endTime: shift === 'mañana' ? '08:45' : '13:45',
            isBreak: false,
            sortOrder: hours.length,
        });
    };

    const handleDelete = async () => {
        if (deletingHour) {
            await deleteMutation.mutateAsync(deletingHour.id);
            setDeletingHour(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-rose-50/20 border border-rose-200 rounded-lg p-8 text-center shadow-none">
                <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" />
                <p className="text-rose-700 font-bold text-sm uppercase tracking-widest">Error al cargar horarios</p>
                <Button variant="outline" onClick={() => refetch()} className="mt-4 border-rose-200 text-rose-700 hover:bg-rose-50">
                    Reintentar
                </Button>
            </div>
        );
    }

    const ShiftSection = ({ 
        title, 
        icon: Icon, 
        hours: shiftHours, 
        shift 
    }: { 
        title: string; 
        icon: any; 
        hours: PedagogicalHour[];
        shift: 'mañana' | 'tarde';
    }) => (
        <div className="flex-1 min-w-[320px] bg-card/40 border border-border rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        shift === 'mañana' ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-sm uppercase tracking-tighter text-foreground">{title}</h3>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mt-0.5">
                            {shiftHours.length} {shiftHours.length === 1 ? 'Hora' : 'Horas'} Configurada{shiftHours.length !== 1 && 's'}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => addHourByShift(shift)}
                    disabled={createMutation.isPending}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-md border-border hover:bg-primary hover:text-white hover:border-primary transition-all shadow-none"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            
            <div className="p-2 space-y-1 min-h-[120px]">
                {shiftHours.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-10 opacity-30 grayscale">
                         <div className="text-center">
                            <Icon className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Sin horarios</p>
                         </div>
                    </div>
                ) : (
                    shiftHours.map((hour, idx) => (
                        <div
                            key={hour.id}
                            className="group flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-border hover:bg-background/80 transition-all text-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-7 h-7 rounded bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-[10px] shrink-0">
                                    {idx + 1}°
                                </div>
                                <span className="font-bold text-foreground tracking-tight">{hour.name}</span>
                            </div>
                            
                            <Button
                                onClick={() => setDeletingHour(hour)}
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ShiftSection 
                    title="Turno Mañana" 
                    icon={Sun} 
                    hours={morningHours}
                    shift="mañana"
                />
                <ShiftSection 
                    title="Turno Tarde" 
                    icon={Moon} 
                    hours={afternoonHours}
                    shift="tarde"
                />
            </div>

            {/* Delete Confirmation: Institutional Action Box */}
            <ActionConfirm
                open={!!deletingHour}
                onOpenChange={(open) => !open && setDeletingHour(null)}
                title="¿Confirmar eliminación de horario?"
                description={`Estás por eliminar la "${deletingHour?.name}" del cronograma institucional. Esta acción no se puede deshacer y afectará la visualización de todos los calendarios.`}
                onConfirm={handleDelete}
                confirmText="Confirmar eliminación"
                variant="destructive"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
