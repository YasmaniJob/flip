'use client';

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/atoms/button';
import { useRescheduleBlock, useReservationsByDateRange, ReservationSlot } from '../hooks/use-reservations';
import { usePedagogicalHours } from '@/features/settings/hooks/use-pedagogical-hours';
import { ChevronLeft, ChevronRight, Check, Calendar, RefreshCw } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { getWeekStart, formatDateKey, parseDateSafe } from '../utils/date-utils';

interface RescheduleDialogProps {
    slot: ReservationSlot;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface SelectedSlot {
    date: Date;
    hourId: string;
}

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export function RescheduleDialog({ slot, open, onOpenChange }: RescheduleDialogProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(parseDateSafe(slot.date)));
    const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
    const [dragState, setDragState] = useState<{ isDragging: boolean; mode: 'select' | 'deselect' | null }>({ isDragging: false, mode: null });

    const rescheduleBlockMutation = useRescheduleBlock();
    const { data: rawPedagogicalHours } = usePedagogicalHours();

    // Fetch reservations for current week
    const weekEnd = useMemo(() => addDays(currentWeekStart, 6), [currentWeekStart]);
    const { data: reservations } = useReservationsByDateRange(
        formatDateKey(currentWeekStart),
        formatDateKey(weekEnd)
    );

    // Create a map for quick lookup and group original slots
    const { reservedSlotsMap, originalReservationSlots } = useMemo(() => {
        const map = new Map<string, ReservationSlot>();
        const originalSlots: ReservationSlot[] = [];

        if (reservations) {
            reservations.forEach(r => {
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
        return [...rawPedagogicalHours].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }, [rawPedagogicalHours]);

    const weekDatesData = useMemo(() => {
        return WEEKDAYS.map((name, i) => {
            const date = addDays(currentWeekStart, i);
            return { date, key: date.toDateString(), day: date.getDate(), name };
        });
    }, [currentWeekStart]);

    const navigateWeek = (direction: 'prev' | 'next') => {
        setCurrentWeekStart(prev => addDays(prev, direction === 'next' ? 7 : -7));
    };

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (dragState.isDragging) {
                setDragState({ isDragging: false, mode: null });
            }
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [dragState.isDragging]);

    const selectedSlotKeys = useMemo(() => {
        const keys = new Set<string>();
        selectedSlots.forEach(s => keys.add(`${s.date.toDateString()}-${s.hourId}`));
        return keys;
    }, [selectedSlots]);

    const isSelected = (dateKey: string, hourId: string) => {
        return selectedSlotKeys.has(`${dateKey}-${hourId}`);
    };

    const toggleCellSelection = (date: Date, hourId: string, mode: 'select' | 'deselect') => {
        setSelectedSlots(prev => {
            const dateKey = date.toDateString();
            const exists = prev.some(s => s.date.toDateString() === dateKey && s.hourId === hourId);

            if (mode === 'deselect' && exists) {
                return prev.filter(s => !(s.date.toDateString() === dateKey && s.hourId === hourId));
            }

            if (mode === 'select' && !exists) {
                if (prev.length >= requiredSlotsCount) {
                    // Remove first item to allow "sliding" the selection range
                    return [...prev.slice(1), { date, hourId }];
                }
                return [...prev, { date, hourId }];
            }

            return prev;
        });
    };

    const handleMouseDown = (date: Date, dateKey: string, hourId: string, isBreak?: boolean, isReserved?: boolean) => {
        if (isBreak || isReserved) return;
        const currentlySelected = isSelected(dateKey, hourId);
        const newMode = currentlySelected ? 'deselect' : 'select';

        setDragState({ isDragging: true, mode: newMode });
        toggleCellSelection(date, hourId, newMode);
    };

    const handleMouseEnter = (date: Date, hourId: string, isBreak?: boolean, isReserved?: boolean) => {
        if (!dragState.isDragging || isBreak || isReserved) return;
        toggleCellSelection(date, hourId, dragState.mode!);
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
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-primary" />
                        Reprogramar {requiredSlotsCount > 1 ? `bloque de ${requiredSlotsCount} horas` : 'Reserva'}
                    </DialogTitle>
                    <DialogDescription>
                        Selecciona {requiredSlotsCount} {requiredSlotsCount === 1 ? 'nuevo horario' : 'nuevos horarios'} para reubicar la reserva de {slot.staff?.name}
                    </DialogDescription>
                </DialogHeader>

                {/* Week Navigation */}
                <div className="flex items-center justify-between py-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigateWeek('prev')}
                        className="rounded-full h-8 w-8"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-sm text-slate-700">
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
                <div className="border rounded-xl overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="p-2 w-24 border-r border-slate-100 text-left text-xs font-medium text-slate-500">Hora</th>
                                {weekDatesData.map((dObj, i) => (
                                    <th key={i} className="p-2 text-center border-r last:border-r-0 border-slate-100">
                                        <div className="text-[10px] font-medium text-slate-400 uppercase">{dObj.name.slice(0, 3)}</div>
                                        <div className="text-sm font-semibold text-slate-700">{dObj.day}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {pedagogicalHours.map(hour => (
                                <tr key={hour.id}>
                                    <td className="px-2 py-1.5 border-t border-r border-slate-100">
                                        <span className="text-xs font-medium text-slate-400">{hour.name}</span>
                                    </td>
                                    {weekDatesData.map((dObj, i) => {
                                        const isCurrent = isCurrentSlot(dObj.key, hour.id);
                                        const isSlotSelected = isSelected(dObj.key, hour.id);
                                        const reservedSlot = getReservedSlot(dObj.key, hour.id);
                                        const isReserved = !!reservedSlot && !isCurrent;

                                        if (hour.isBreak) {
                                            return (
                                                <td key={i} className="p-1 border-t border-r last:border-r-0 border-slate-100">
                                                    <div className="h-8 flex items-center justify-center">
                                                        <span className="text-[10px] text-amber-500">—</span>
                                                    </div>
                                                </td>
                                            );
                                        }

                                        return (
                                            <td
                                                key={i}
                                                className={`p-1 border-t border-r last:border-r-0 border-slate-100 ${!isReserved && !isCurrent ? 'cursor-pointer select-none' : ''}`}
                                                onMouseDown={() => handleMouseDown(dObj.date, dObj.key, hour.id, hour.isBreak, isReserved)}
                                                onMouseEnter={() => handleMouseEnter(dObj.date, hour.id, hour.isBreak, isReserved)}
                                            >
                                                <div className={`rounded-lg py-1.5 px-2 text-[10px] font-medium text-center transition-all ${isCurrent
                                                    ? 'bg-slate-200 text-slate-500'
                                                    : isReserved
                                                        ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                        : isSlotSelected
                                                            ? 'bg-primary text-white'
                                                            : 'text-slate-400 hover:bg-slate-50'
                                                    }`}>
                                                    {isCurrent
                                                        ? 'Actual'
                                                        : isReserved
                                                            ? (reservedSlot?.staff?.name || 'Reservado')
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

                <DialogFooter>
                    <Button variant="outline" onClick={() => {
                        onOpenChange(false);
                        setSelectedSlots([]);
                    }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleReschedule}
                        disabled={selectedSlots.length !== requiredSlotsCount || isPending}
                    >
                        {isPending ? 'Reprogramando...' : `Confirmar (${selectedSlots.length}/${requiredSlotsCount})`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
