'use client';

import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { useCreateReservation, useReservationsByDateRange } from '../hooks/use-reservations';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/atoms/button';
import { Textarea } from '@/components/ui/textarea';
import { X, CheckCircle2, GraduationCap, Building2, User, Search, Check, BookOpen, ChevronLeft, ChevronRight, Users, Calendar } from "lucide-react";
import { cn } from '@/lib/utils';
import { useStaff, useRecurrentStaff, useMyStaff } from '@/features/staff/hooks/use-staff';
import { useDebounce } from '@/hooks/use-debounce';
import { useConfigLoadout } from '@/features/settings/hooks/use-config-loadout';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUserRole } from '@/hooks/use-user-role';

interface SelectedSlot {
    date: Date;
    pedagogicalHourId: string;
}

interface ReservationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedSlots?: SelectedSlot[];
    pedagogicalHours?: { id: string; name: string; startTime: string; endTime: string; isBreak?: boolean; sortOrder?: number }[];
    classroomId?: string | null;
    selectedShift?: 'mañana' | 'tarde';
}

type ReservationType = 'learning' | 'institutional' | 'workshop';

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function ReservationDialog({
    open,
    onOpenChange,
    selectedSlots: initialSelectedSlots = [],
    classroomId,
    pedagogicalHours: propPedagogicalHours,
    selectedShift: initialShift = 'mañana',
}: ReservationDialogProps) {
    const [purpose, setPurpose] = useState('');
    const [tallerTitle, setTallerTitle] = useState('');
    const [reservationType, setReservationType] = useState<ReservationType>('learning');
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
    const [selectedStaffName, setSelectedStaffName] = useState<string | null>(null);
    const [selectedStaffRole, setSelectedStaffRole] = useState<string | null>(null);
    const [gradeId, setGradeId] = useState<string | null>(null);
    const [sectionId, setSectionId] = useState<string | null>(null);
    const [curricularAreaId, setCurricularAreaId] = useState<string | null>(null);
    const [viewState, setViewState] = useState<'CONTEXT' | 'PLANNING'>('CONTEXT');

    // Week navigation
    const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
    const weekEnd = useMemo(() => addDays(currentWeekStart, 6), [currentWeekStart]);

    // Local slots state for selection within dialog
    const [localSlots, setLocalSlots] = useState<SelectedSlot[]>(initialSelectedSlots);

    // Sync initial slots when dialog opens
    useEffect(() => {
        if (open) {
            if (initialSelectedSlots.length > 0) {
                setLocalSlots(initialSelectedSlots);
                // Navigate to the week of the first selected slot
                const firstSlot = initialSelectedSlots[0];
                if (firstSlot) {
                    setCurrentWeekStart(getWeekStart(firstSlot.date));
                }
            }
            // Always show identification (CONTEXT) first as requested by user
            setViewState('CONTEXT');
        }
    }, [open, initialSelectedSlots]);

    const { data: myStaff } = useMyStaff();
    const { canManage, user } = useUserRole();

    // Auto-set staff ID to current user by default ONLY if they are a regular teacher (!canManage)
    useEffect(() => {
        if (open && myStaff?.id && !selectedStaffId && !canManage) {
            setSelectedStaffId(myStaff.id);
            setSelectedStaffName(myStaff.name || '');
            setSelectedStaffRole(user?.role || 'Docente');
        }
    }, [open, myStaff, selectedStaffId, canManage, user?.role]);

    // UI States
    const [staffSearch, setStaffSearch] = useState('');
    const debouncedStaffSearch = useDebounce(staffSearch, 500);

    const createMutation = useCreateReservation();

    // Data hooks
    const { staff } = useStaff({ search: debouncedStaffSearch, limit: 20, includeAdmins: true });
    const { data: recurrentStaff } = useRecurrentStaff(6);

    // Unified Data Loadout
    const { data: config, isLoading: isLoadingConfig } = useConfigLoadout();
    
    // Extracted from loadout
    const grades = config?.grades;
    const curricularAreas = config?.curricularAreas;
    const rawPedagogicalHours = config?.pedagogicalHours;

    // Local filter for sections (No network round-trip when grade changes)
    const sections = useMemo(() => {
        if (!config?.sections || !gradeId) return [];
        return config.sections.filter(s => s.gradeId === gradeId);
    }, [config?.sections, gradeId]);

    const [selectedShift, setSelectedShift] = useState<'mañana' | 'tarde'>(initialShift);

    // Sync shift when prop changes or dialog opens
    useEffect(() => {
        if (open) {
            setSelectedShift(initialShift);
        }
    }, [open, initialShift]);

    // Get existing reservations for current week
    const { data: existingSlots } = useReservationsByDateRange(
        formatDateForApi(currentWeekStart),
        formatDateForApi(weekEnd)
    );

    // Process pedagogical hours (prefer prop, fallback to fetch)
    const pedagogicalHours = useMemo(() => {
        const source = propPedagogicalHours || rawPedagogicalHours;
        if (!source) return [];
        
        let filtered = [...source].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        
        // Filter by shift: Morning < 13:00, Afternoon >= 13:00
        if (selectedShift === 'mañana') {
            filtered = filtered.filter(h => h.startTime < '13:00');
        } else {
            filtered = filtered.filter(h => h.startTime >= '13:00');
        }
        
        return filtered;
    }, [propPedagogicalHours, rawPedagogicalHours, selectedShift]);

    // Data for Summary Chips
    const gradeName = useMemo(() => gradeId && grades?.find(g => g.id === gradeId)?.name.replace('Grado', '').trim(), [gradeId, grades]);
    const sectionName = useMemo(() => sectionId && sections?.find(s => s.id === sectionId)?.name, [sectionId, sections]);
    const areaName = useMemo(() => curricularAreaId && curricularAreas?.find(a => a.id === curricularAreaId)?.name, [curricularAreaId, curricularAreas]);

    // Generate week dates (Mon-Fri)
    const weekDates = useMemo(() => {
        return WEEKDAYS.map((_, i) => addDays(currentWeekStart, i));
    }, [currentWeekStart]);

    // Map existing reservations
    const existingSlotMap = useMemo(() => {
        const map: Record<string, boolean> = {};
        existingSlots?.forEach(slot => {
            const dateKey = new Date(slot.date).toDateString();
            const key = `${dateKey}-${slot.pedagogicalHour.id}`;
            map[key] = true;
        });
        return map;
    }, [existingSlots]);


    const isSlotSelected = (date: Date, hourId: string) => {
        return localSlots.some(
            s => s.date.toDateString() === date.toDateString() && s.pedagogicalHourId === hourId
        );
    };

    const isSlotReserved = (date: Date, hourId: string) => {
        const dateKey = date.toDateString();
        const key = `${dateKey}-${hourId}`;
        return existingSlotMap[key];
    };

    const handleCellClick = (date: Date, hour: { id: string; isBreak?: boolean }) => {
        if (hour.isBreak) return;
        if (isSlotReserved(date, hour.id)) return;

        const dateKey = date.toDateString();
        const exists = localSlots.find(
            s => s.date.toDateString() === dateKey && s.pedagogicalHourId === hour.id
        );

        if (exists) {
            setLocalSlots(prev => prev.filter(
                s => !(s.date.toDateString() === dateKey && s.pedagogicalHourId === hour.id)
            ));
        } else {
            setLocalSlots(prev => [...prev, { date, pedagogicalHourId: hour.id }]);
        }
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        setCurrentWeekStart(prev => addDays(prev, direction === 'next' ? 7 : -7));
    };

    const handleSubmit = async () => {
        if (localSlots.length === 0) {
            toast.error('Seleccione al menos una sesión en el calendario');
            return;
        }
        
        if (!selectedStaffId) {
            toast.error('Debe seleccionar un docente responsable');
            setViewState('CONTEXT'); // Take them back to fix it
            return;
        }

        if (reservationType === 'workshop' && !tallerTitle) {
            toast.error('Ingrese el título del proyecto o taller');
            setViewState('CONTEXT');
            return;
        }

        try {
            await createMutation.mutateAsync({
                staffId: selectedStaffId,
                classroomId: classroomId || undefined,
                slots: localSlots.map(s => ({
                    pedagogicalHourId: s.pedagogicalHourId,
                    date: s.date.toISOString(),
                })),
                purpose: purpose || undefined,
                gradeId: reservationType === 'learning' ? gradeId || undefined : undefined,
                sectionId: reservationType === 'learning' ? sectionId || undefined : undefined,
                curricularAreaId: reservationType === 'learning' ? curricularAreaId || undefined : undefined,
                type: reservationType === 'workshop' ? 'workshop' : 'class',
                title: reservationType === 'workshop' ? tallerTitle : undefined,
            });

            handleClose();
        } catch (error) {
            // Error is handled by mutation hook toasts
        }
    };

    const handleClose = () => {
        setPurpose('');
        setTallerTitle('');
        if (canManage) {
            setSelectedStaffId(null);
            setSelectedStaffName(null);
            setSelectedStaffRole(null);
        }
        setGradeId(null);
        setSectionId(null);
        setCurricularAreaId(null);
        setReservationType('learning');
        setLocalSlots([]);
        onOpenChange(false);
    };



    const canContinueToPlanning = useMemo(() => {
        if (!selectedStaffId || !classroomId) return false;
        if (reservationType === 'workshop') {
            return tallerTitle.trim().length > 2;
        }
        if (reservationType === 'learning') {
            return !!sectionId;
        }
        return true; // institutional
    }, [selectedStaffId, reservationType, tallerTitle, sectionId]);

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent showCloseButton={false} className="sm:max-w-[900px] w-[95vw] max-h-[88vh] min-h-[560px] h-auto p-0 flex flex-col overflow-hidden border border-border shadow-none bg-background rounded-md">
                <DialogTitle className="sr-only">Nueva Reserva de Aula</DialogTitle>

                {/* Vertical Top-Down Layout */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* 1. Header: Slim Manifest Summary */}
                    <header className="shrink-0 border-b border-border bg-muted/20 px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-5 bg-primary rounded-full" />
                                <h2 className="text-sm font-black text-foreground tracking-widest uppercase">
                                    {viewState === 'CONTEXT' && selectedStaffId
                                        ? <span className="flex items-center gap-2">
                                            Reserva
                                            <span className="text-muted-foreground font-bold">·</span>
                                            <span className="text-primary dark:text-blue-400">{selectedStaffName}</span>
                                          </span>
                                        : viewState === 'CONTEXT' ? 'Contexto Pedagógico'
                                        : 'Programación de Horarios'
                                    }
                                </h2>
                            </div>

                            {/* Live Summary Chips (Persistent in PLANNING mode) */}
                            {viewState === 'PLANNING' && (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 transition-all">
                                    <div className="h-4 w-px bg-border mx-1" />

                                    {!selectedStaffId ? (
                                        <button
                                            onClick={() => setViewState('CONTEXT')}
                                            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/10 border border-destructive/20 text-[9px] font-bold text-destructive uppercase tracking-widest hover:bg-destructive/20 transition-colors"
                                        >
                                            <User className="h-3 w-3" />
                                            Sin Responsable
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-border text-[9px] font-bold text-foreground uppercase tracking-widest">
                                                <User className="h-3 w-3 text-primary" />
                                                {canManage ? selectedStaffName : "Tú (Docente)"}
                                            </div>
                                            {(curricularAreaId || gradeId) && (
                                               <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-background border border-border text-[9px] font-bold text-muted-foreground uppercase tracking-widest max-w-[220px]">
                                                {gradeId && <span className="shrink-0 text-foreground">{gradeName?.replace('Grado', '').trim()}G</span>}
                                                {sectionId && <span className="shrink-0 text-foreground">{sectionName}</span>}
                                                {(gradeId || sectionId) && curricularAreaId && <span className="shrink-0 text-border">•</span>}
                                                {curricularAreaId && <span className="truncate">{areaName}</span>}
                                            </div>
                                            )}
                                            <button
                                                onClick={() => setViewState('CONTEXT')}
                                                className="text-[9px] font-black text-primary hover:underline uppercase tracking-widest ml-2"
                                            >
                                                Cambiar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleClose}
                            className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-md transition-colors text-muted-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </header>

                    {/* 2. Main Discovery Canvas */}
                    <main className="flex-1 flex flex-col bg-background overflow-hidden relative">
                    {viewState === 'CONTEXT' ? (
                        <div className="flex-1 flex overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                             {/* Sidebar: Context & Responsibility (Left) */}
                             <aside className="w-[320px] shrink-0 border-r border-border bg-muted/20 flex flex-col overflow-hidden">
                                <div className="p-6 space-y-8 flex-1 overflow-y-auto scrollbar-hide">
                                    {/* Teacher Chip */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Responsable</label>
                                        {canManage ? (
                                            !selectedStaffId ? (
                                                <div className="relative group">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        autoFocus
                                                        placeholder="BUSCAR..."
                                                        value={staffSearch}
                                                        onChange={(e) => setStaffSearch(e.target.value)}
                                                        className="w-full pl-9 pr-6 h-10 rounded-sm border border-border bg-background text-[11px] font-bold focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-muted-foreground/30"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 p-3 rounded-sm border border-border bg-card overflow-hidden">
                                                    <div className="w-8 h-8 rounded-sm bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                                                        {selectedStaffName?.[0]}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[11px] font-black uppercase truncate text-foreground">{selectedStaffName}</p>
                                                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest truncate mt-0.5">{selectedStaffRole || 'Docente'}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => { setSelectedStaffId(null); setSelectedStaffName(null); setSelectedStaffRole(null); }}
                                                        className="w-6 h-6 border-transparent rounded-full flex items-center justify-center shrink-0 hover:bg-destructive hover:text-white transition-all text-muted-foreground bg-muted/50"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            )
                                        ) : (
                                            <div className="flex items-center gap-3 p-3 rounded-sm border border-border bg-card">
                                                <div className="w-8 h-8 rounded-sm bg-primary text-primary-foreground flex items-center justify-center text-xs font-black shrink-0">
                                                    {user?.name?.[0]}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11px] font-black uppercase truncate text-foreground">{user?.name}</p>
                                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest truncate mt-0.5">Tú</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Type Switcher */}
                                    <div className="space-y-4 pt-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Propósito Pedagógico</label>
                                        <div className="grid grid-cols-1 gap-1">
                                            {(['learning', 'workshop', 'institutional'] as const).map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setReservationType(t)}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 h-10 rounded-sm border transition-all text-left",
                                                        reservationType === t
                                                            ? "bg-primary text-primary-foreground border-primary shadow-none"
                                                            : "bg-card border-border text-muted-foreground hover:bg-muted/30"
                                                    )}
                                                >
                                                    {t === 'learning' ? <GraduationCap size={14} /> : t === 'workshop' ? <Users size={14} /> : <Building2 size={14} />}
                                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                                        {t === 'learning' ? 'Sesión de Clase' : t === 'workshop' ? 'Proyecto / Taller' : 'Gestión y Otros'}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Purpose (Textarea) */}
                                    <div className="space-y-4 pt-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Propósito de la Actividad</label>
                                        <Textarea
                                            placeholder="Detalles sobre el logro esperado..."
                                            value={purpose}
                                            onChange={(e) => setPurpose(e.target.value)}
                                            className="w-full bg-card border border-border rounded-sm h-32 px-4 py-3 text-[11px] font-bold text-foreground focus:border-primary focus:ring-0 outline-none transition-all resize-none placeholder:text-muted-foreground/30 shadow-none scrollbar-hide"
                                        />
                                    </div>
                                </div>
                             </aside>

                             {/* Main Panel: Selection (Right) */}
                             <div className="flex-1 flex flex-col overflow-hidden bg-background p-10">
                                {canManage && !selectedStaffId ? (
                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        {!staff?.length && staffSearch ? (
                                            <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                                                <Users className="h-8 w-8 mb-4 lg:scale-150 mb-8" />
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Sin resultados docentes</p>
                                            </div>
                                        ) : staffSearch ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-2 custom-scrollbar">
                                                {staff?.map((s) => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => { setSelectedStaffId(s.id); setSelectedStaffName(s.name); setSelectedStaffRole(s.role || 'Docente'); }}
                                                        className="group flex items-center gap-3 p-3 rounded-sm border border-border bg-card hover:border-primary/40 hover:bg-primary/[0.02] transition-all text-left"
                                                    >
                                                        <div className="w-10 h-10 rounded-sm flex items-center justify-center text-[11px] font-black shrink-0 border border-border bg-muted group-hover:border-primary/20 transition-all">
                                                            {s.name[0]}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[10px] font-black uppercase truncate tracking-tight text-foreground">{s.name}</p>
                                                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest truncate mt-0.5">{s.role}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col space-y-10 overflow-y-auto pr-2 custom-scrollbar">
                                                {recurrentStaff && recurrentStaff.length > 0 && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Docentes Frecuentes</span>
                                                            <div className="flex-1 h-px bg-border/50" />
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {recurrentStaff.map((s) => (
                                                                <button
                                                                    key={s.id}
                                                                    onClick={() => { setSelectedStaffId(s.id); setSelectedStaffName(s.name); setSelectedStaffRole(s.role || 'Docente'); }}
                                                                    className="group flex items-center gap-3 p-3 rounded-sm border border-border bg-card hover:border-primary/40 hover:bg-primary/[0.02] transition-all text-left"
                                                                >
                                                                    <div className="w-10 h-10 rounded-sm flex items-center justify-center text-[11px] font-black shrink-0 border border-primary/20 bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                                                                        {s.name[0]}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-[10px] font-black uppercase truncate tracking-tight text-foreground">{s.name}</p>
                                                                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest truncate mt-0.5">{s.role}</p>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="py-12 border-2 border-dashed border-border/50 rounded-md flex flex-col items-center justify-center opacity-30">
                                                    <Search className="h-6 w-6 mb-3" />
                                                    <p className="text-[9px] font-black uppercase tracking-[0.4em]">Usa el buscador para otros docentes</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col overflow-hidden space-y-10">
                                        {reservationType === 'learning' ? (
                                            <div className="flex-1 flex flex-col overflow-hidden space-y-10">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] block">Área Curricular</label>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {curricularAreas?.map((area) => (
                                                            <button
                                                                key={area.id}
                                                                onClick={() => setCurricularAreaId(area.id)}
                                                                className={cn(
                                                                    "flex items-center gap-3 p-3 rounded-sm min-h-[44px] transition-all text-left border overflow-hidden",
                                                                    curricularAreaId === area.id
                                                                        ? "bg-primary text-primary-foreground border-primary shadow-none"
                                                                        : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-muted/30"
                                                                )}
                                                            >
                                                                <BookOpen size={12} className={cn("shrink-0", curricularAreaId === area.id ? "text-primary-foreground" : "text-muted-foreground/40")} />
                                                                <span className="text-[9px] font-black uppercase tracking-widest leading-tight flex-1">{area.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Grade & Section Row */}
                                                {curricularAreaId && (
                                                    <div className="grid grid-cols-2 gap-10 pt-8 border-t border-border animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="space-y-4">
                                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] block">Grado Académico</label>
                                                            <div className="flex flex-wrap gap-1">
                                                                {isLoadingConfig ? (
                                                                    <div className="h-9 w-full flex items-center justify-center border border-dashed border-border/30 rounded-sm bg-muted/30 animate-pulse">
                                                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/20 italic">Cargando grados...</span>
                                                                    </div>
                                                                ) : !grades?.length ? (
                                                                    <div className="h-9 w-full flex items-center justify-center border border-dashed border-destructive/20 rounded-sm bg-destructive/[0.02]">
                                                                        <span className="text-[8px] font-black uppercase tracking-widest text-destructive/40 italic">No hay grados configurados</span>
                                                                    </div>
                                                                ) : (
                                                                    grades.map((grade) => (
                                                                        <button key={grade.id} onClick={() => { setGradeId(grade.id); setSectionId(null); }}
                                                                            className={cn("h-9 w-12 text-[10px] font-black rounded-sm transition-all border uppercase",
                                                                                gradeId === grade.id
                                                                                    ? "bg-primary text-primary-foreground border-primary"
                                                                                    : "bg-card text-muted-foreground border-border hover:bg-muted/30"
                                                                            )}
                                                                        >{grade.name.replace('Grado', '').trim()}G</button>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] block">Sección</label>
                                                            <div className="flex flex-wrap gap-1">
                                                                {gradeId ? (
                                                                    sections.length === 0 ? (
                                                                        <div className="h-9 w-full flex items-center justify-center border border-dashed border-destructive/20 rounded-sm bg-destructive/[0.02]">
                                                                            <span className="text-[8px] font-black uppercase tracking-widest text-destructive/40 italic">No hay secciones en este grado</span>
                                                                        </div>
                                                                    ) : (
                                                                        sections.map((section) => (
                                                                            <button key={section.id} onClick={() => setSectionId(section.id)}
                                                                                className={cn("h-9 w-9 text-[10px] font-black rounded-sm transition-all border uppercase",
                                                                                    sectionId === section.id
                                                                                        ? "bg-primary text-primary-foreground border-primary shadow-none"
                                                                                        : "bg-card text-muted-foreground border-border hover:bg-muted/30"
                                                                                )}
                                                                            >{section.name}</button>
                                                                        ))
                                                                    )
                                                                ) : (
                                                                    <div className="h-9 w-full flex items-center justify-center border border-dashed border-border/50 rounded-sm bg-muted/30">
                                                                        <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">Elige un grado primero</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-top-2 duration-500">
                                                {reservationType === 'workshop' && (
                                                    <div className="space-y-4 max-w-xl">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] block">Nombre de la Actividad</label>
                                                        <input
                                                            placeholder="EJ. TALLER DE ROBÓTICA..."
                                                            value={tallerTitle}
                                                            onChange={(e) => setTallerTitle(e.target.value)}
                                                            className="w-full bg-card border border-border rounded-sm h-12 px-6 text-xs font-black text-foreground focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-muted-foreground/20 uppercase tracking-widest"
                                                        />
                                                    </div>
                                                )}
                                                                               {reservationType === 'institutional' && (
                                                    <div className="p-10 flex items-center gap-8 bg-primary/5 border border-primary/10 rounded-sm">
                                                        <div className="w-16 h-16 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                                                            <Building2 className="h-8 w-8 text-primary" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Gestión Institucional</h5>
                                                            <p className="text-[10px] font-bold text-primary/70 leading-relaxed uppercase tracking-widest max-w-md">
                                                                Reservas para gestión operativa, capacitaciones internas o eventos administrativos de la institución.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                             </div>
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                             {/* Planning Toolbox */}
                            <div className="shrink-0 px-8 py-4 border-b border-border flex items-center justify-between bg-muted/10">
                                <div className="flex items-center gap-6">
                                    <div className="flex gap-1 bg-background p-1 rounded-sm border border-border">
                                        {(['mañana', 'tarde'] as const).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setSelectedShift(s)}
                                                className={cn(
                                                    "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm",
                                                    selectedShift === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="h-6 w-px bg-border" />
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                                            Semana del {format(currentWeekStart, "d 'de' MMMM", { locale: es })}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')} className="rounded-md border border-border h-9 w-9">
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')} className="rounded-md border border-border h-9 w-9">
                                        <ChevronRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="flex-1 flex flex-col px-8 py-6 overflow-hidden">
                                <table className="w-full h-full border-collapse table-fixed select-none">
                                    <thead>
                                        <tr className="border-b border-border/50 h-12">
                                            <th className="w-24 font-black text-[10px] text-muted-foreground uppercase tracking-widest text-left">Hora</th>
                                            {weekDates.map((date) => (
                                                <th key={date.toISOString()} className="px-3">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter">{format(date, 'EEEE', { locale: es })}</span>
                                                        <span className={cn(
                                                            "text-sm font-black",
                                                            isSameDay(date, new Date()) ? "text-primary" : "text-foreground"
                                                        )}>{format(date, 'd')}</span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {pedagogicalHours?.map((hour) => (
                                            <tr key={hour.id} className="group border-b border-border/40 last:border-0 h-[14.2%]">
                                                <td className="w-24 py-3 border-r border-border/10 bg-muted/[0.01]">
                                                    <div className="flex flex-col justify-center h-full">
                                                        <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground leading-none">{hour.name}</span>
                                                    </div>
                                                </td>
                                                {weekDates.map((date) => {
                                                    const isSelected = isSlotSelected(date, hour.id);
                                                    const isReserved = isSlotReserved(date, hour.id);
                                                    const isToday = isSameDay(date, new Date());
                                                    
                                                    if (hour.isBreak) {
                                                        return (
                                                            <td key={date.toISOString()} className={cn("p-0 bg-muted/[0.01]", isToday && "bg-primary/[0.005]")}>
                                                                <div className="h-full flex items-center justify-center opacity-10 font-black text-[9px] tracking-[0.8em] uppercase -rotate-90">RECESO</div>
                                                            </td>
                                                        );
                                                    }

                                                    if (isReserved) {
                                                        return (
                                                            <td key={date.toISOString()} className={cn("p-2 bg-muted/[0.02]", isToday && "bg-primary/[0.005]")}>
                                                                <div className="h-full flex items-center justify-center bg-muted/30 border border-border/40 rounded-sm text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 italic select-none">
                                                                    Ocupado
                                                                </div>
                                                            </td>
                                                        );
                                                    }

                                                    return (
                                                        <td 
                                                            key={date.toISOString()} 
                                                            className={cn("p-2 cursor-pointer transition-all hover:bg-primary/[0.01]", isToday && "bg-primary/[0.01]")}
                                                            onClick={() => handleCellClick(date, hour)}
                                                        >
                                                            <div className={cn(
                                                                "h-full flex items-center justify-center rounded-sm border transition-all text-[10px] font-black uppercase tracking-widest shadow-none",
                                                                isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-transparent border-transparent hover:border-primary/20 hover:text-primary/30"
                                                            )}>
                                                                {isSelected ? <Check className="h-5 w-5 animate-in zoom-in duration-200" /> : "Elija"}
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
                    )}
                </main>

                {/* 3. Global Action Bar */}
                <div className="shrink-0 px-8 py-5 bg-background border-t border-border flex items-center justify-between gap-4">
                    <div>
                        {viewState === 'PLANNING' && (
                            <Button variant="ghost" onClick={() => setViewState('CONTEXT')} className="font-black uppercase tracking-widest text-[10px] px-8 h-12 gap-3 border border-transparent hover:border-border transition-all active:scale-95">
                                <ChevronLeft className="h-4 w-4" />
                                Modificar Detalles
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={handleClose} className="font-black uppercase tracking-widest text-[10px] px-8 h-12 hover:bg-muted/50 transition-all">
                            Cancelar
                        </Button>

                        {viewState === 'CONTEXT' ? (
                            <div className="flex items-center gap-3">
                                {localSlots.length > 0 && (
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setViewState('PLANNING')}
                                        className="font-black uppercase tracking-widest text-[10px] px-6 h-12 hover:bg-muted/50 transition-all border border-border/50"
                                    >
                                        Ajustar Horarios
                                    </Button>
                                )}
                                <div className="relative group">
                                    <Button 
                                        disabled={!canContinueToPlanning || (localSlots.length > 0 && createMutation.isPending)}
                                        onClick={localSlots.length > 0 ? handleSubmit : () => setViewState('PLANNING')}
                                        variant={localSlots.length > 0 ? "jira" : "default"}
                                        className={cn(
                                            "h-12 font-black uppercase tracking-[0.2em] text-[10px] shadow-none gap-4 transition-all active:scale-95 group relative",
                                            localSlots.length > 0 ? "min-w-[220px]" : "px-12"
                                        )}
                                    >
                                        {localSlots.length > 0 ? (
                                            <>
                                                {createMutation.isPending ? "Registrando..." : `Confirmar Reserva (${localSlots.length})`}
                                                {!createMutation.isPending && <CheckCircle2 className="h-4 w-4" />}
                                            </>
                                        ) : (
                                            <>
                                                Definir Horarios
                                                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </Button>

                                    {!canContinueToPlanning && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-destructive/10 border border-destructive/20 px-3 py-1.5 rounded-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-[8px] font-black text-destructive uppercase tracking-widest whitespace-nowrap">
                                                {!classroomId ? "No se ha detectado el aula" : 
                                                 reservationType === 'learning' 
                                                    ? (!gradeId ? "Seleccione Grado" : !sectionId ? "Seleccione Sección" : !selectedStaffId ? "Seleccione Responsable" : "Faltan Datos")
                                                    : reservationType === 'workshop' && !tallerTitle ? "Ingrese Título" : !selectedStaffId ? "Seleccione Responsable" : "Faltan Datos"
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Button 
                                onClick={handleSubmit}
                                disabled={createMutation.isPending || localSlots.length === 0 || !canContinueToPlanning}
                                variant="jira"
                                className="min-w-[280px] h-12 font-black uppercase tracking-[0.2em] text-[10px] shadow-none gap-4 transition-all active:scale-[0.98] animate-in slide-in-from-right-2"
                            >
                                {createMutation.isPending ? "Registrando Reserva..." : `Confirmar Reserva (${localSlots.length} Horas)`}
                                {!createMutation.isPending && <CheckCircle2 className="h-4 w-4" />}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
);
}
