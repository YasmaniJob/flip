'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    usePedagogicalHours,
    useCreatePedagogicalHour,
    useDeletePedagogicalHour,
    type PedagogicalHour,
} from '@/features/settings/hooks/use-pedagogical-hours';
import { Plus, Trash2, Loader2, AlertCircle, Sun, Moon, Wand2, Clock, Coffee } from 'lucide-react';
import { ActionConfirm } from '@/components/molecules/action-confirm';
import { BulkCreateHoursDialog } from './bulk-create-hours-dialog';
import { cn } from '@/lib/utils';

export function PedagogicalHoursSettings() {
    const { data: hours = [], isLoading, isError, refetch } = usePedagogicalHours();
    const createMutation = useCreatePedagogicalHour();
    const deleteMutation = useDeletePedagogicalHour();

    // Dialog states
    const [deletingHour, setDeletingHour] = useState<PedagogicalHour | null>(null);
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    const [selectedShift, setSelectedShift] = useState<'mañana' | 'tarde'>('mañana');

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

    const addBreakByShift = async (shift: 'mañana' | 'tarde') => {
        await createMutation.mutateAsync({
            name: 'RECREO',
            startTime: shift === 'mañana' ? '10:00' : '15:45',
            endTime: shift === 'mañana' ? '10:15' : '16:00',
            isBreak: true,
            sortOrder: hours.length,
        });
    };

    const openBulkGenerator = (shift: 'mañana' | 'tarde') => {
        setSelectedShift(shift);
        setShowBulkDialog(true);
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
        <div className="flex-1 min-w-[320px] bg-white border border-border rounded-xl flex flex-col overflow-hidden shadow-none">
            <div className="px-6 py-5 border-b border-border bg-muted/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded flex items-center justify-center transition-transform hover:scale-105",
                        shift === 'mañana' ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                    )}>
                        <Icon className="size-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-sm uppercase tracking-[0.1em] text-foreground">{title}</h3>
                        <p className="text-[10px] text-muted-foreground/40 uppercase font-bold tracking-widest leading-none mt-1">
                            {shiftHours.filter(h => !h.isBreak).length} horas pedagógicas
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => openBulkGenerator(shift)}
                        variant="jiraOutline"
                        size="sm"
                        className="h-8 px-4 text-[10px] font-black uppercase tracking-widest shadow-none gap-2"
                    >
                        <Wand2 className="h-3.5 w-3.5" />
                        Generador
                    </Button>
                    <Button
                        onClick={() => addBreakByShift(shift)}
                        disabled={createMutation.isPending}
                        variant="jiraOutline"
                        size="sm"
                        className="h-8 px-3 text-[10px] font-black uppercase tracking-widest shadow-none gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                    >
                        <Coffee className="h-3.5 w-3.5" />
                        Receso
                    </Button>
                    <div className="w-px h-5 bg-border mx-1" />
                    <Button
                        onClick={() => addHourByShift(shift)}
                        disabled={createMutation.isPending}
                        variant="jira"
                        size="icon"
                        className="h-8 w-8 shadow-none"
                    >
                        <Plus className="h-4 w-4 stroke-[3]" />
                    </Button>
                </div>
            </div>
            
            <div className="p-6 md:p-8 space-y-4 flex-1 bg-white">
                {shiftHours.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 opacity-30 grayscale">
                        <Icon className="h-10 w-10 mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-center">Sin horarios<br/>configurados</p>
                    </div>
                ) : (
                    (() => {
                        let pedagogicalCounter = 0;
                        return shiftHours.map((hour, idx) => {
                            if (!hour.isBreak) pedagogicalCounter++;
                            const currentNum = pedagogicalCounter;
                            
                            return (
                                <div
                                    key={hour.id}
                                    className={cn(
                                        "group flex items-center gap-5 p-4 rounded-xl border transition-all animate-in fade-in slide-in-from-right-4 duration-300",
                                        hour.isBreak 
                                            ? "bg-amber-50/50 border-amber-200/60" 
                                            : "bg-white border-border/80 hover:border-primary/40 hover:bg-primary/[0.02]"
                                    )}
                                    style={{ animationDelay: `${idx * 40}ms` }}
                                >
                                    <div className={cn(
                                        "size-10 rounded flex items-center justify-center font-black text-xs tabular-nums shrink-0 transition-transform group-hover:scale-105",
                                        hour.isBreak 
                                            ? "bg-amber-100 text-amber-700 border border-amber-200" 
                                            : "bg-muted/10 text-primary border border-border shadow-none"
                                    )}>
                                        {hour.isBreak ? 'R' : `${currentNum}°`}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className={cn("text-xs font-black tracking-tight uppercase truncate", hour.isBreak ? "text-amber-900" : "text-foreground")}>
                                            {hour.name}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className={cn("size-3", hour.isBreak ? "text-amber-500/30" : "text-muted-foreground/20")} />
                                            <span className={cn(
                                                "text-[10px] font-bold tabular-nums uppercase tracking-[0.1em]",
                                                hour.isBreak ? "text-amber-600/60" : "text-muted-foreground/40"
                                            )}>
                                                {hour.startTime} — {hour.endTime}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded border tabular-nums group-hover:opacity-100 transition-opacity select-none",
                                            hour.isBreak ? "border-amber-200/50 text-amber-700/50" : "border-border/50 text-muted-foreground/20"
                                        )}>
                                            {hour.isBreak ? 'R' : currentNum}
                                        </div>
                                        
                                        <Button
                                            onClick={() => setDeletingHour(hour)}
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-600 hover:bg-rose-50 shadow-none shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        });
                    })()
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

            {/* Bulk Creation Dialog */}
            <BulkCreateHoursDialog
                open={showBulkDialog}
                onOpenChange={setShowBulkDialog}
                shift={selectedShift}
                existingCount={selectedShift === 'mañana' ? morningHours.length : afternoonHours.length}
            />

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
