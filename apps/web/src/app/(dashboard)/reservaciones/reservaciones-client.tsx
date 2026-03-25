"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { 
    useReservationsByDateRange, 
    useRescheduleBlock
} from "@/features/reservations/hooks/use-reservations";
import { useClassrooms } from "@/features/classrooms/hooks/use-classrooms";
import { usePedagogicalHours } from "@/features/settings/hooks/use-pedagogical-hours";
import { ReservationSlot } from "@/features/reservations/api/reservations.api";
import { ReservationDialog } from "@/features/reservations/components/reservation-dialog";
import { WorkshopDetailSheet } from "@/features/reservations/components/workshop-detail-sheet";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AnimatePresence } from "framer-motion";
import { useUserRole } from "@/hooks/use-user-role";
import { useAcademicDefaults } from "../../../hooks/use-academic-defaults";
import { ReservationCard } from "@/features/reservations/components/reservation-card";
import { SelectionActionBar } from "@/features/reservations/components/selection-action-bar";
import { DroppableCell } from "@/features/reservations/components/droppable-cell";

// Mobile components
import { MobileWeekStrip } from "@/features/reservations/components/mobile-week-strip";
import { MobileScheduleView } from "@/features/reservations/components/mobile-schedule-view";
import { MobileReservationSheet } from "@/features/reservations/components/mobile-reservation-sheet";
import { MobileFilterSheet } from "@/features/reservations/components/mobile-filter-sheet";
import { MobileReservationWizard } from "@/features/reservations/components/mobile-reservation-wizard";

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export type Shift = 'mañana' | 'tarde';

export function ReservacionesClient() {
    const { user, canManage } = useUserRole();
    const { data: defaults, isLoading: isLoadingDefaults } = useAcademicDefaults();
    
    // UI State
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    });

    const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");
    const [selectedShift, setSelectedShift] = useState<Shift | undefined>(undefined);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<{ date: Date; pedagogicalHourId: string }[]>([]);
    const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
    const [selectedTitle, setSelectedTitle] = useState<string>("");
    const [selectedMobileDate, setSelectedMobileDate] = useState<Date>(new Date());
    const [mobileSheetSlot, setMobileSheetSlot] = useState<ReservationSlot | null>(null);
    const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
    const [isClassroomSheetOpen, setIsClassroomSheetOpen] = useState(false);
    const [isShiftSheetOpen, setIsShiftSheetOpen] = useState(false);

    // Drag and Drop State
    const [dragState, setDragState] = useState<{
        isDragging: boolean;
        sourceSlot: ReservationSlot | null;
        blockSlots: ReservationSlot[];
    }>({
        isDragging: false,
        sourceSlot: null,
        blockSlots: []
    });

    // Data Fetching
    const { data: classrooms, isLoading: isLoadingClassrooms } = useClassrooms();
    
    // Set defaults only once when data loads
    useEffect(() => {
        if (isLoadingDefaults || isLoadingClassrooms) return;
        
        // Set classroom only if not already set
        if (!selectedClassroomId && classrooms && classrooms.length > 0) {
            const defaultClassroom = defaults?.classroomId 
                ? classrooms.find(c => c.id === defaults.classroomId)
                : classrooms.find(c => c.isPrimary) || classrooms[0];
            
            if (defaultClassroom) {
                setSelectedClassroomId(defaultClassroom.id);
            }
        }
        
        // Set shift only if not already set
        if (!selectedShift) {
            setSelectedShift((defaults?.shift as Shift) || "mañana");
        }
    }, [defaults, isLoadingDefaults, isLoadingClassrooms, classrooms, selectedClassroomId, selectedShift]);

    const weekEnd = useMemo(() => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + 5);
        return d;
  }, [currentWeekStart]);

    // Only fetch when we have all required data
    const shouldFetch = !!selectedClassroomId && !!selectedShift && !isLoadingDefaults && !isLoadingClassrooms;

    const { data: slots, isFetching: isFetchingSlots, error: errorSlots } = useReservationsByDateRange(
        currentWeekStart.toISOString().split('T')[0],
        weekEnd.toISOString().split('T')[0],
        selectedClassroomId,
        selectedShift
    );

    const { data: rawPedagogicalHours = [], isLoading: isLoadingHours, error: errorHours } = usePedagogicalHours();

    const pedagogicalHours = useMemo(() => {
        if (!rawPedagogicalHours) return [];
        let filtered = [...rawPedagogicalHours].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        
        if (selectedShift === 'mañana') {
            filtered = filtered.filter(h => h.startTime < '13:00');
        } else {
            filtered = filtered.filter(h => h.startTime >= '13:00');
        }
        return filtered;
    }, [rawPedagogicalHours, selectedShift]);

    const rescheduleBlockMutation = useRescheduleBlock();

    // Memoized Mappings
    const slotMap = useMemo(() => {
        const map = new Map<string, ReservationSlot>();
        if (!slots) return map;
        slots.forEach(slot => {
            if (slot.classroomId === selectedClassroomId) {
                const dateKey = new Date(slot.date).toDateString();
                map.set(`${dateKey}-${slot.pedagogicalHour.id}`, slot);
            }
        });
        return map;
    }, [slots, selectedClassroomId]);

    const weekDates = useMemo(() => {
        return Array.from({ length: 6 }, (_, i) => {
            const d = new Date(currentWeekStart);
            d.setDate(d.getDate() + i);
            return d;
        });
    }, [currentWeekStart]);

    const selectedSlotKeys = useMemo(() => {
        return new Set(selectedSlots.map(s => `${s.date.toDateString()}-${s.pedagogicalHourId}`));
    }, [selectedSlots]);

    // Handlers
    const navigateWeek = useCallback((direction: 'prev' | 'next') => {
        setCurrentWeekStart(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
            return d;
        });
    }, []);

    const handleCellClick = useCallback((date: Date, hour: { id: string; isBreak?: boolean }) => {
        if (hour.isBreak) return;

        const key = `${date.toDateString()}-${hour.id}`;
        const existingSlot = slotMap.get(key);

        if (existingSlot) {
            if (canManage && existingSlot.type === 'workshop' && existingSlot.reservationMainId) {
                setSelectedReservationId(existingSlot.reservationMainId);
                setSelectedTitle(existingSlot.title || "Detalles del Taller");
            }
            return;
        }

        setSelectedSlots(prev => {
            const exists = prev.find(s => s.date.getTime() === date.getTime() && s.pedagogicalHourId === hour.id);
            if (exists) {
                return prev.filter(s => !(s.date.getTime() === date.getTime() && s.pedagogicalHourId === hour.id));
            }
            return [...prev, { date, pedagogicalHourId: hour.id }];
        });
    }, [slotMap, canManage]);

    const handleDragStart = useCallback((e: React.DragEvent, slot: ReservationSlot) => {
        if (!canManage && user?.id !== slot.staff?.id) return;

        const blockSlots = slots?.filter(s => s.reservationMainId === slot.reservationMainId) || [];
        setDragState({
            isDragging: true,
            sourceSlot: slot,
            blockSlots
        });
        
        e.dataTransfer.setData('application/json', JSON.stringify({
            mainId: slot.reservationMainId,
            staffId: slot.staff?.id
        }));
        e.dataTransfer.effectAllowed = 'move';
  }, [canManage, user?.id, slots]);

    const handleDragEnd = useCallback(() => {
        setDragState({ isDragging: false, sourceSlot: null, blockSlots: [] });
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent, targetDate: Date, targetHourId: string) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;

        const { mainId } = JSON.parse(data);
        const sourceHourIndex = pedagogicalHours.findIndex(h => h.id === dragState.sourceSlot?.pedagogicalHour.id);
        const targetHourIndex = pedagogicalHours.findIndex(h => h.id === targetHourId);

        if (sourceHourIndex === -1 || targetHourIndex === -1) return;

        const hourOffset = targetHourIndex - sourceHourIndex;
        const dateOffset = Math.round((targetDate.getTime() - new Date(dragState.sourceSlot!.date).getTime()) / (1000 * 60 * 60 * 24));

        const updates = dragState.blockSlots.map(slot => {
            const currentHourIndex = pedagogicalHours.findIndex(h => h.id === slot.pedagogicalHour.id);
            const newHour = pedagogicalHours[currentHourIndex + hourOffset];
            const newDate = new Date(slot.date);
            newDate.setDate(newDate.getDate() + dateOffset);

            return {
                date: newDate.toISOString(),
                pedagogicalHourId: newHour.id
            };
        });

        const hasCollision = updates.some(u => {
            const key = `${new Date(u.date).toDateString()}-${u.pedagogicalHourId}`;
            const existing = slotMap.get(key);
            return existing && existing.reservationMainId !== mainId;
        });

        if (hasCollision) return;

        try {
            await rescheduleBlockMutation.mutateAsync({ reservationId: mainId, slots: updates });
        } catch (err) {
            console.error("Failed to reschedule:", err);
        }
    }, [dragState, pedagogicalHours, slotMap, rescheduleBlockMutation]);

    const handleOpenDialog = () => setIsDialogOpen(true);
    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setSelectedSlots([]);
    };

    const isLoading = isLoadingClassrooms || isLoadingHours || isLoadingDefaults;

    if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando reservas y horarios...</div>;
    if (errorSlots || errorHours) return <div className="p-8 text-center text-red-500">Error al cargar datos del sistema</div>;

    const todayDateString = new Date().toDateString();

    return (
        <>
            {/* Mobile View */}
            <div className="lg:hidden bg-background min-h-screen">
                {/* Filter Buttons - Single Row */}
                <div className="flex gap-2 px-4 pt-4 pb-3">
                    <button
                        onClick={() => setIsClassroomSheetOpen(true)}
                        className="flex-1 px-4 py-3 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors text-left shadow-sm"
                    >
                        <span className="text-xs text-muted-foreground block mb-1">Aula</span>
                        <span className="truncate block">{classrooms?.find(c => c.id === selectedClassroomId)?.name || 'Seleccionar'}</span>
                    </button>
                    <button
                        onClick={() => setIsShiftSheetOpen(true)}
                        className="flex-shrink-0 px-4 py-3 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors text-left shadow-sm capitalize min-w-[120px]"
                    >
                        <span className="text-xs text-muted-foreground block mb-1">Turno</span>
                        {selectedShift || 'Seleccionar'}
                    </button>
                </div>

                <MobileWeekStrip 
                    currentWeekStart={currentWeekStart}
                    onNavigate={navigateWeek}
                    weekDates={weekDates}
                    selectedDate={selectedMobileDate}
                    onDateSelect={setSelectedMobileDate}
                />

                <MobileScheduleView 
                    pedagogicalHours={pedagogicalHours}
                    selectedDate={selectedMobileDate}
                    slotMap={slotMap}
                    selectedSlots={selectedSlots}
                    onSlotClick={(slot, hourId) => {
                        if (slot) {
                            // Show bottom sheet with slot details
                            setMobileSheetSlot(slot);
                            setIsMobileSheetOpen(true);
                        } else {
                            // Toggle selection for empty slot
                            handleCellClick(selectedMobileDate, { id: hourId });
                        }
                    }}
                />

                {/* Selection Action Bar - Mobile */}
                {selectedSlots.length > 0 && canManage && !isDialogOpen && (
                    <div className="lg:hidden fixed bottom-20 left-0 right-0 z-50 px-4 pb-4">
                        <div className="bg-primary text-primary-foreground rounded-lg shadow-2xl p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold">
                                    {selectedSlots.length} {selectedSlots.length === 1 ? 'hora seleccionada' : 'horas seleccionadas'}
                                </p>
                                <p className="text-xs opacity-80">
                                    {selectedMobileDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedSlots([])}
                                    className="px-4 py-2 bg-primary-foreground/20 hover:bg-primary-foreground/30 rounded-lg text-sm font-semibold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => setIsDialogOpen(true)}
                                    className="px-4 py-2 bg-primary-foreground text-primary rounded-lg text-sm font-semibold hover:bg-primary-foreground/90 transition-colors"
                                >
                                    Crear reserva
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Reservation Sheet */}
                <MobileReservationSheet 
                    slot={mobileSheetSlot}
                    open={isMobileSheetOpen}
                    onClose={() => {
                        setIsMobileSheetOpen(false);
                        setMobileSheetSlot(null);
                    }}
                    onViewDetails={() => {
                        if (mobileSheetSlot?.reservationMainId) {
                            setSelectedReservationId(mobileSheetSlot.reservationMainId);
                            setSelectedTitle(mobileSheetSlot.title || "Detalles del Taller");
                        }
                    }}
                    onMarkAttendance={() => {
                        // Open attendance marking - will open the full detail sheet
                        if (mobileSheetSlot?.reservationMainId) {
                            setSelectedReservationId(mobileSheetSlot.reservationMainId);
                            setSelectedTitle(mobileSheetSlot.title || "Detalles del Taller");
                        }
                    }}
                    onReschedule={() => {
                        // TODO: Implement reschedule functionality
                        console.log('Reschedule:', mobileSheetSlot);
                    }}
                    onCancel={() => {
                        // TODO: Implement cancel functionality
                        console.log('Cancel:', mobileSheetSlot);
                    }}
                    canManage={canManage}
                />

                {/* Mobile Reservation Wizard */}
                <MobileReservationWizard 
                    open={isDialogOpen}
                    onClose={() => {
                        setIsDialogOpen(false);
                        setSelectedSlots([]);
                    }}
                    selectedSlots={selectedSlots}
                    classroomId={selectedClassroomId}
                    onSuccess={() => {
                        setSelectedSlots([]);
                    }}
                />

                {/* Classroom Filter Sheet */}
                <MobileFilterSheet 
                    open={isClassroomSheetOpen}
                    onClose={() => setIsClassroomSheetOpen(false)}
                    title="Seleccionar Aula"
                    options={classrooms?.filter(c => c.active).map(c => ({ id: c.id, name: c.name })) || []}
                    selectedId={selectedClassroomId}
                    onSelect={setSelectedClassroomId}
                />

                {/* Shift Filter Sheet */}
                <MobileFilterSheet 
                    open={isShiftSheetOpen}
                    onClose={() => setIsShiftSheetOpen(false)}
                    title="Seleccionar Turno"
                    options={[
                        { id: 'mañana', name: 'Mañana' },
                        { id: 'tarde', name: 'Tarde' }
                    ]}
                    selectedId={selectedShift || 'mañana'}
                    onSelect={(shift) => setSelectedShift(shift as Shift)}
                />
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block p-6 sm:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6 relative">
            <PageHeader
                title="Reservaciones del AIP"
            />

            {/* Context Toolbar - Minimalist Underline Design */}
            <div className="flex items-center justify-between gap-12 border-b border-border/30 pb-0.5">
                <div className="flex items-center gap-8">
                    {classrooms?.filter(c => c.active).map(classroom => (
                        <button
                            key={classroom.id}
                            onClick={() => setSelectedClassroomId(classroom.id)}
                            className={cn(
                                "pb-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative",
                                selectedClassroomId === classroom.id 
                                    ? "text-primary border-b-2 border-primary" 
                                    : "text-muted-foreground/30 hover:text-foreground/50 border-b-2 border-transparent"
                            )}
                        >
                            {classroom.name}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-8 ml-auto">
                    {(['mañana', 'tarde'] as Shift[]).map((shift) => (
                        <button
                            key={shift}
                            onClick={() => setSelectedShift(shift)}
                            className={cn(
                                "pb-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative",
                                selectedShift === shift 
                                    ? "text-primary border-b-2 border-primary" 
                                    : "text-muted-foreground/30 hover:text-foreground/50 border-b-2 border-transparent"
                            )}
                        >
                            {shift}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Calendar Container - BOXED to match other pages */}
            <main className="bg-card border border-border rounded-lg overflow-hidden transition-all">
                <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center justify-between select-none">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-10 px-4 rounded-md font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all w-32"
                        onClick={() => navigateWeek('prev')}
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Anterior
                    </Button>

                    <div className="flex flex-col items-center gap-1 text-center">
                        <span className="text-sm font-black uppercase tracking-tighter text-foreground tabular-nums">
                            {currentWeekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — {weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {new Date() >= currentWeekStart && new Date() <= weekEnd && (
                            <div className="px-2 py-0.5 bg-primary/10 rounded-full text-[8px] font-black text-primary uppercase tracking-[0.2em]">
                                Esta Semana
                            </div>
                        )}
                    </div>

                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-10 px-4 rounded-md font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all w-32"
                        onClick={() => navigateWeek('next')}
                    >
                        Siguiente
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full border-spacing-0 border-collapse">
                        <thead>
                            <tr className="bg-muted/5">
                                <th className="p-5 w-24 border-r border-border text-left">
                                    <span className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">H/D</span>
                                </th>
                                {weekDates.map((date, i) => {
                                    const isToday = date.toDateString() === todayDateString;
                                    return (
                                        <th key={i} className={cn("p-4 text-center border-border", i !== weekDates.length - 1 && "border-r", isToday && "bg-primary/[0.02]")}>
                                            <div className="inline-flex flex-col items-center">
                                                <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", isToday ? "text-primary" : "text-muted-foreground")}>
                                                    {WEEKDAYS[i].slice(0, 3)}
                                                </span>
                                                <div className={cn("text-2xl font-black mt-1 tabular-nums tracking-tighter", isToday ? "text-primary" : "text-foreground")}>
                                                    {date.getDate()}
                                                </div>
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {pedagogicalHours.map(hour => {
                                const isLiveRow = isCurrentHour(hour.startTime, hour.endTime);
                                return (
                                    <tr key={hour.id} className="group">
                                        <td className={cn("px-4 py-7 border-t border-r border-border bg-muted/10 group-hover:bg-muted/20 transition-colors relative", isLiveRow && "bg-primary/[0.04]")}>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={cn("text-[10px] font-black uppercase tracking-widest leading-none", isLiveRow ? "text-primary" : "text-muted-foreground")}>
                                                    {hour.name}
                                                </span>
                                            </div>
                                            {isLiveRow && (
                                                <div className="absolute right-[-1px] top-1/2 -translate-y-1/2 w-1.5 h-11 bg-primary rounded-l-full" />
                                            )}
                                        </td>
                                        {weekDates.map((date, i) => {
                                            const dateKey = date.toDateString();
                                            const key = `${dateKey}-${hour.id}`;
                                            const slot = slotMap.get(key);
                                            const isToday = dateKey === todayDateString;
                                            const isLastCol = i === weekDates.length - 1;

                                            if (hour.isBreak) return (
                                                <td key={i} className={cn("p-2 border-t border-border", !isLastCol && "border-r")}>
                                                    <div className="h-full flex items-center justify-center opacity-10 font-black text-xs tracking-[1em] uppercase -rotate-90 text-muted-foreground/50">RECESO</div>
                                                </td>
                                            );

                                            if (slot) {
                                                const canDrag = canManage || (user?.id === slot.staff?.id);
                                                return (
                                                    <td key={i} className={cn("p-2 border-t border-border", !isLastCol && "border-r", isToday && "bg-primary/[0.02]")}>
                                                        <ReservationCard 
                                                            slot={slot}
                                                            isToday={isToday}
                                                            isLive={isToday && isLiveRow}
                                                            canDrag={canDrag}
                                                            isAdmin={canManage}
                                                            onDragStart={handleDragStart}
                                                            onDragEnd={handleDragEnd}
                                                            onSelectReservation={setSelectedReservationId}
                                                            isDraggingSelection={dragState.isDragging && dragState.blockSlots.some(s => s.id === slot.id)}
                                                        />
                                                    </td>
                                                );
                                            }

                                            return (
                                                <DroppableCell 
                                                    key={i}
                                                    isLast={isLastCol}
                                                    isToday={isToday}
                                                    isSelected={selectedSlotKeys.has(key)}
                                                    onClick={() => handleCellClick(date, hour)}
                                                    onDrop={(e) => handleDrop(e, date, hour.id)}
                                                />
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </main>

            <AnimatePresence>
                {selectedSlots.length > 0 && canManage && !isDialogOpen && (
                    <SelectionActionBar 
                        selectedIds={selectedSlots.map(s => s.pedagogicalHourId)}
                        onConfirm={handleOpenDialog}
                        onClear={() => setSelectedSlots([])}
                        isPending={false}
                        isAdmin={canManage}
                    />
                )}
            </AnimatePresence>

            <ReservationDialog
                open={isDialogOpen}
                onOpenChange={handleDialogClose}
                selectedSlots={selectedSlots}
                pedagogicalHours={pedagogicalHours}
                classroomId={selectedClassroomId}
                selectedShift={selectedShift}
            />

            <Dialog open={!!selectedReservationId} onOpenChange={(open) => !open && setSelectedReservationId(null)}>
                <DialogContent className="sm:max-w-2xl w-full h-full p-0 flex flex-col gap-0 border-none rounded-none fixed right-0 top-0 bottom-0 left-auto translate-x-0 translate-y-0 m-0 z-50">
                    <DialogTitle className="sr-only">Detalles del taller</DialogTitle>
                    <DialogDescription className="sr-only">Gestión de asistencia y acuerdos.</DialogDescription>
                    {selectedReservationId && <WorkshopDetailSheet reservationId={selectedReservationId} title={selectedTitle} />}
                </DialogContent>
            </Dialog>
            </div>
        </>
    );
}

function isCurrentHour(start: string, end: string) {
    const now = new Date();
    const startTime = new Date();
    const endTime = new Date();

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    startTime.setHours(startH, startM, 0);
    endTime.setHours(endH, endM, 0);

    return now >= startTime && now <= endTime;
}
