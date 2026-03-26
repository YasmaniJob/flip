'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/atoms/button';
import { useRescheduleBlock, useReservationsByDateRange, ReservationSlot } from '../hooks/use-reservations';
import { usePedagogicalHours } from '@/features/settings/hooks/use-pedagogical-hours';
import { ChevronLeft, ChevronRight, Check, Calendar, RefreshCw } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { getWeekStart, formatDateKey, parseDateSafe } from '../utils/date-utils';
import { cn } from '@/lib/utils';

interface RescheduleDialogProps {
    slot: ReservationSlot;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    shift?: 'mañana' | 'tarde';
    classroomId?: string;
}

interface SelectedSlot {
    date: Date;
    hourId: string;
}

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export function RescheduleDialog({ slot, open, onOpenChange, shift, classroomId }: RescheduleDialogProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(parseDateSafe(slot.date)));
    const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);

    const rescheduleBlockMutation = useRescheduleBlock();
    const { data: rawPedagogicalHours } = usePedagogicalHours();

    // Fetch reservations for current week
    const weekEnd = useMemo(() => addDays(currentWeekStart, 6), [currentWeekStart]);
    const { data: reservations } = useReservationsByDateRange(
        formatDateKey(currentWeekStart),
        formatDateKey(weekEnd),
        classroomId,
        shift
    );

    // Create a map for quick lookup and group original slots
    const { reservedSlotsMap, originalReservationSlots } = useMemo(() => {
        const map = new Map<string, ReservationSlot>();
        const originalSlots: ReservationSlot[] = [];

        if (reservations && Array.isArray(reservations)) {
            reservations.forEach((r: ReservationSlot) => {
                const localDate = parseDateSafe(r.date);
                const key = `${localDate.toDateString()}-${r.pedagogicalHour.id}`;
                map.set(key, r);

                if (r.reservationId === slot.reservationId || r.reservationMainId === slot.reservationMainId) {
                    originalSlots.push(r);
                }
            });
        }
        return { reservedSlotsMap: map, originalReservationSlots: originalSlots };
    }, [reservations, slot.reservationId, slot.reservationMainId]);

    const requiredSlotsCount = originalReservationSlots.length > 0 ? originalReservationSlots.length : 1;

    const pedagogicalHours = useMemo(() => {
        if (!rawPedagogicalHours) return [];
        let filtered = [...rawPedagogicalHours].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        
        if (shift === 'mañana') {
            filtered = filtered.filter(h => h.startTime < '13:00');
        } else if (shift === 'tarde') {
            filtered = filtered.filter(h => h.startTime >= '13:00');
        }
        
        return filtered;
    }, [rawPedagogicalHours, shift]);

    const weekDatesData = useMemo(() => {
        return WEEKDAYS.map((name, i) => {
            const date = addDays(currentWeekStart, i);
            return { date, key: date.toDateString(), day: date.getDate(), name };
        });
    }, [currentWeekStart]);

    const navigateWeek = (direction: 'prev' | 'next') => {
        setCurrentWeekStart(prev => addDays(prev, direction === 'next' ? 7 : -7));
    };

    const isSelected = (dateKey: string, hourId: string) => {
        return selectedSlots.some(s => s.date.toDateString() === dateKey && s.hourId === hourId);
    };

    const toggleCellSelection = (date: Date, hourId: string) => {
        setSelectedSlots(prev => {
            const dateKey = date.toDateString();
            const exists = prev.some(s => s.date.toDateString() === dateKey && s.hourId === hourId);

            if (exists) {
                return prev.filter(s => !(s.date.toDateString() === dateKey && s.hourId === hourId));
            }

            // Normal single click toggle
            if (prev.length >= requiredSlotsCount) {
                // Remove the first one and add the new one if we only need X slots
                if (requiredSlotsCount === 1) return [{ date, hourId }];
                return [...prev.slice(1), { date, hourId }];
            }
            return [...prev, { date, hourId }];
        });
    };

    const handleReschedule = async () => {
        if (selectedSlots.length !== requiredSlotsCount) return;

        try {
            const mappedSlots = selectedSlots.map(s => ({
                pedagogicalHourId: s.hourId,
                date: formatDateKey(s.date),
            }));

            await rescheduleBlockMutation.mutateAsync({
                reservationId: slot.reservationId || slot.reservationMainId || slot.id,
                slots: mappedSlots,
            });

            onOpenChange(false);
            setSelectedSlots([]);
        } catch (error) {
            // Error handled by mutation
        }
    };

    const slotDateKey = parseDateSafe(slot.date).toDateString();
    const isCurrentSlot = (dateKey: string, hourId: string) => {
        return dateKey === slotDateKey && hourId === slot.pedagogicalHour.id;
    };

    const getReservedSlot = (dateKey: string, hourId: string) => {
        const key = `${dateKey}-${hourId}`;
        return reservedSlotsMap.get(key);
    };

    const isPending = rescheduleBlockMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) setSelectedSlots([]);
        }}>
            <DialogContent 
                showCloseButton={false}
                className={cn(
                    "w-[calc(100%-0rem)] max-w-none p-0 gap-0 flex flex-col",
                    "fixed inset-x-0 bottom-0 top-auto translate-x-0 translate-y-0",
                    "rounded-t-2xl border-t border-x-0 border-b-0",
                    "max-h-[90vh] data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
                    "lg:inset-x-auto lg:top-[50%] lg:left-[50%] lg:bottom-auto",
                    "lg:translate-x-[-50%] lg:translate-y-[-50%]",
                    "lg:max-w-3xl lg:max-h-[85vh] lg:rounded-lg lg:border",
                    "lg:data-[state=open]:zoom-in-95 lg:data-[state=closed]:zoom-out-95"
                )}
            >
                <div className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-left">
                            <RefreshCw className="h-5 w-5 text-primary" />
                            Reprogramar {requiredSlotsCount > 1 ? `bloque de ${requiredSlotsCount} horas` : 'Reserva'}
                        </DialogTitle>
                        <DialogDescription className="text-left">
                            Selecciona {requiredSlotsCount} {requiredSlotsCount === 1 ? 'nuevo horario' : 'nuevos horarios'} para reubicar la reserva de {slot.staff?.name}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {/* Week Navigation */}
                    <div className="flex items-center justify-between py-2 mb-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigateWeek('prev')}
                            className="rounded-full h-8 w-8"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm text-foreground">
                                {format(currentWeekStart, "d 'de' MMMM", { locale: es })}
                                {' - '}
                                {format(addDays(currentWeekStart, 4), "d 'de' MMMM 'de' yyyy", { locale: es })}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigateWeek('next')}
                            className="rounded-full h-8 w-8"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="border border-border rounded-xl overflow-hidden">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-muted/30">
                                    <th className="p-2 w-20 lg:w-24 border-r border-border text-left text-[10px] lg:text-xs font-medium text-muted-foreground">Hora</th>
                                    {weekDatesData.map((dObj, i) => (
                                        <th key={i} className="p-2 text-center border-r last:border-r-0 border-border">
                                            <div className="text-[9px] lg:text-[10px] font-medium text-muted-foreground uppercase">{dObj.name.slice(0, 3)}</div>
                                            <div className="text-xs lg:text-sm font-semibold text-foreground">{dObj.day}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {pedagogicalHours.map(hour => (
                                    <tr key={hour.id}>
                                        <td className="px-2 py-1.5 border-t border-r border-border">
                                            <span className="text-[10px] lg:text-xs font-medium text-muted-foreground">{hour.name}</span>
                                        </td>
                                        {weekDatesData.map((dObj, i) => {
                                            const isCurrent = isCurrentSlot(dObj.key, hour.id);
                                            const isSlotSelected = isSelected(dObj.key, hour.id);
                                            const reservedSlot = getReservedSlot(dObj.key, hour.id);
                                            const isReserved = !!reservedSlot && !isCurrent;

                                            if (hour.isBreak) {
                                                return (
                                                    <td key={i} className="p-1 border-t border-r last:border-r-0 border-border">
                                                        <div className="h-8 flex items-center justify-center">
                                                            <span className="text-[10px] text-amber-500">—</span>
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td
                                                    key={i}
                                                    className={`p-1 border-t border-r last:border-r-0 border-border ${!isReserved && !isCurrent ? 'cursor-pointer select-none active:bg-muted/50 transition-colors' : ''}`}
                                                    onClick={() => {
                                                        if (!isReserved && !isCurrent) {
                                                            toggleCellSelection(dObj.date, hour.id);
                                                        }
                                                    }}
                                                >
                                                    <div className={`rounded-lg py-1.5 px-1 lg:px-2 text-[9px] lg:text-[10px] font-medium text-center transition-all ${isCurrent
                                                        ? 'bg-muted text-muted-foreground'
                                                        : isReserved
                                                            ? 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900'
                                                            : isSlotSelected
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'text-muted-foreground hover:bg-muted/50'
                                                        }`}>
                                                        {isCurrent
                                                            ? 'Actual'
                                                            : isReserved
                                                                ? (reservedSlot?.staff?.name?.split(' ')[0] || 'Reservado')
                                                                : isSlotSelected
                                                                    ? <Check className="h-3 w-3 mx-auto" />
                                                                    : null
                                                        }
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-border">
                    <DialogFooter className="flex-row gap-2 sm:flex-row sm:gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                onOpenChange(false);
                                setSelectedSlots([]);
                            }}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleReschedule}
                            disabled={selectedSlots.length !== requiredSlotsCount || isPending}
                            className="flex-1"
                        >
                            {isPending ? 'Reprogramando...' : `Confirmar (${selectedSlots.length}/${requiredSlotsCount})`}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
