'use client';

import { useMemo } from 'react';
import { Loader2, Calendar, Plus, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useMyTodayReservations } from '@/features/reservations/hooks/use-reservations';
import { useMeetings } from '@/features/meetings/hooks/use-meetings';

interface AgendaItem {
    id: string;
    type: 'class' | 'workshop' | 'meeting';
    title: string;
    timeStart: string;
    timeEnd: string;
    sortTime: number;
    statusLabel: string;
    isCompleted: boolean;
    isPast: boolean;
    isNext: boolean; // The next upcoming item
}

function getTypeLabel(type: AgendaItem['type']) {
    if (type === 'meeting') return 'Reunión';
    if (type === 'workshop') return 'Taller';
    return 'Clase de Aula';
}



// Utility for time parsing
const parseTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

export function TodayAgenda() {
    const router = useRouter();

    const { data: todayReservations, isLoading: isReservationsLoading } = useMyTodayReservations();
    const { data: allMeetings, isLoading: isMeetingsLoading } = useMeetings();

    const isLoading = isReservationsLoading || isMeetingsLoading;

    const items = useMemo<AgendaItem[]>(() => {
        const agenda: AgendaItem[] = [];
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        if (todayReservations) {
            todayReservations.forEach(slot => {
                const start = slot.pedagogicalHour?.startTime?.substring(0, 5) || "00:00";
                const end = slot.pedagogicalHour?.endTime?.substring(0, 5) || "23:59";
                const startVal = parseTime(start);
                const endVal = parseTime(end);

                const isCompleted = slot.attended || nowMinutes > endVal;

                agenda.push({
                    id: `slot-${slot.id}`,
                    type: (slot.type as any) || 'class',
                    title: slot.title || slot.purpose || (slot.type === 'workshop' ? 'Taller' : 'Clase Regular'),
                    timeStart: start,
                    timeEnd: end,
                    sortTime: startVal,
                    statusLabel: isCompleted ? 'Realizada' : 'Reservada',
                    isCompleted,
                    isPast: nowMinutes > endVal && !slot.attended,
                    isNext: false,
                });
            });
        }

        if (allMeetings) {
            const todayStr = new Date().toLocaleDateString('en-CA');
            const todaysMeetings = allMeetings.filter(m => m.date.startsWith(todayStr));

            todaysMeetings.forEach(meeting => {
                const start = meeting.startTime ? meeting.startTime.substring(0, 5) : "00:00";
                const end = meeting.endTime ? meeting.endTime.substring(0, 5) : "23:59";
                const startVal = parseTime(start);
                const endVal = parseTime(end);
                const isCompleted = meeting.status === 'completed' || nowMinutes > endVal;

                agenda.push({
                    id: `meet-${meeting.id}`,
                    type: 'meeting',
                    title: meeting.title,
                    timeStart: start,
                    timeEnd: end,
                    sortTime: startVal,
                    statusLabel: isCompleted ? 'Finalizada' : 'Reunión',
                    isCompleted,
                    isPast: false,
                    isNext: false,
                });
            });
        }

        const sorted = agenda.sort((a, b) => a.sortTime - b.sortTime);

        // Mark the first non-completed item as the "next" one
        const nextIndex = sorted.findIndex(i => !i.isCompleted);
        if (nextIndex !== -1) sorted[nextIndex].isNext = true;

        return sorted;
    }, [todayReservations, allMeetings]);

    const completedCount = items.filter(i => i.isCompleted).length;
    const nextItem = items.find(i => i.isNext);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 py-12 items-center justify-center text-center bg-card rounded-lg border border-border">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Cargando agenda de hoy...</span>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center rounded-lg bg-muted/30 border border-dashed border-border">
                <div className="h-10 w-10 rounded-full bg-background border border-border flex items-center justify-center mb-3 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-foreground text-base">Agenda despejada</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-xs mx-auto">No hay actividades programadas para hoy.</p>
                <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => router.push('/reservaciones')} className="h-8 rounded-md gap-2 font-bold text-[9px] uppercase tracking-wider px-3">
                        <Plus className="h-3 w-3" /> Agendar Aula
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push('/reuniones')} className="h-8 rounded-md gap-2 font-bold text-[9px] uppercase tracking-wider px-3">
                        <Plus className="h-3 w-3" /> Reunión
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Visual Header Context */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-success" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{completedCount} Completadas</span>
                    </div>
                    <div className="w-px h-3 bg-border" />
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary/40" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{items.length - completedCount} Pendientes</span>
                    </div>
                </div>
                {nextItem && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                        <Clock className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-tight">Próximo: {nextItem.title}</span>
                    </div>
                )}
            </div>

            {/* Visual Timeline Grid */}
            <div className="relative border border-border/40 rounded-lg bg-background/40 backdrop-blur-sm overflow-hidden">
                <div className="grid grid-cols-1 divide-y divide-border/40">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={cn(
                                "group relative flex items-stretch transition-all duration-300",
                                item.isCompleted ? "bg-muted/[0.02]" : "hover:bg-primary/[0.01]",
                                item.isNext ? "bg-primary/[0.03]" : ""
                            )}
                        >
                            {/* Time Pillar */}
                            <div className="w-16 sm:w-20 shrink-0 flex flex-col items-center justify-center border-r border-border/40 py-3 tabular-nums">
                                <span className={cn(
                                    "text-xs font-black tracking-tighter transition-colors",
                                    item.isCompleted ? "text-muted-foreground/50" : "text-foreground"
                                )}>
                                    {item.timeStart}
                                </span>
                                <div className="h-3 w-px bg-border/40 my-1" />
                                <span className="text-[8px] font-bold text-muted-foreground/40">{item.timeEnd}</span>
                            </div>

                            {/* Event Space */}
                            <div className="flex-1 p-3 min-w-0 relative">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                                                item.isCompleted ? "bg-muted text-muted-foreground/60" : "bg-primary/10 text-primary"
                                            )}>
                                                {getTypeLabel(item.type)}
                                            </span>
                                            {item.isNext && !item.isCompleted && (
                                                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                                            )}
                                        </div>
                                        <h3 className={cn(
                                            "text-sm font-bold tracking-tight truncate transition-colors",
                                            item.isCompleted ? "text-muted-foreground/50 line-through" : "text-foreground group-hover:text-primary"
                                        )}>
                                            {item.title}
                                        </h3>
                                    </div>

                                    {/* Action/Status Icon */}
                                    <div className={cn(
                                        "h-8 w-8 rounded-lg flex items-center justify-center border transition-all",
                                        item.isCompleted
                                            ? "border-success/20 bg-success/[0.02] text-success"
                                            : "border-border/60 bg-muted/20 text-muted-foreground group-hover:border-primary/40 group-hover:text-primary"
                                    )}>
                                        {item.isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                                    </div>
                                </div>

                                {/* Item Progress visual (for current) */}
                                {item.isNext && !item.isCompleted && (
                                    <div className="absolute bottom-0 left-0 h-0.5 bg-primary/20 w-full overflow-hidden">
                                        <div className="h-full bg-primary/60 animate-[progress_3s_ease-in-out_infinite]" style={{ width: '30%' }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Vertical Decorative Grid Line */}
                <div className="absolute top-0 left-[20px] sm:left-[24px] w-px h-full bg-primary/5 -z-10" />
            </div>
        </div>
    );
}
