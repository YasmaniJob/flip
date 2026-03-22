'use client';

import { useState, useRef, useCallback } from 'react';
import { useCreateMeeting } from '../hooks/use-meetings';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Briefcase, Users, GraduationCap, Sparkles, CheckCircle2, Loader2, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addHours } from 'date-fns';

import { WizardLayout } from '@/components/layouts/wizard-layout';

interface MeetingWizardProps {
    isOpen: boolean;
    onClose: () => void;
}

const ACTORS = [
    { id: 'Director(a)', label: 'Director(a)', icon: Briefcase },
    { id: 'Sub-Director(a)', label: 'Sub-Director(a)', icon: Users },
    { id: 'Coordinadores', label: 'Coordinadores', icon: Users },
    { id: 'Docentes', label: 'Docentes', icon: GraduationCap },
    { id: 'Otros', label: 'Otros', icon: Sparkles },
];

const AREAS = [
    'Matemática',
    'Comunicación',
    'Inglés',
    'Arte y Cultura',
    'Ciencia y Tecnología',
    'Ciencias Sociales',
    'Desarrollo Personal, Ciudadanía y Cívica',
    'Educación Física',
    'Educación Religiosa',
    'Educación para el Trabajo',
    'Tutoría'
];

export function MeetingWizard({ isOpen, onClose }: MeetingWizardProps) {
    const createMeeting = useCreateMeeting();

    // Initialize with current date and time
    const now = new Date();
    const [formData, setFormData] = useState({
        title: '',
        date: format(now, 'yyyy-MM-dd'),
        startTime: format(now, 'HH:mm'),
        endTime: format(addHours(now, 1), 'HH:mm'),
        type: 'general', // Default generic type
        involvedActors: [] as string[],
        involvedAreas: [] as string[],
        notes: '',
        agreements: [] as string[],
        otherActorSpec: '',
    });

    const toggleActor = (id: string) => {
        setFormData(prev => {
            const isSelecting = !prev.involvedActors.includes(id);

            return {
                ...prev,
                involvedActors: isSelecting
                    ? [...prev.involvedActors, id]
                    : prev.involvedActors.filter(a => a !== id)
            };
        });
    };

    const toggleArea = (area: string) => {
        setFormData(prev => ({
            ...prev,
            involvedAreas: prev.involvedAreas.includes(area)
                ? prev.involvedAreas.filter(areaItem => areaItem !== area)
                : [...prev.involvedAreas, area]
        }));
    };

    const handleClose = () => {
        const resetNow = new Date();
        setFormData({
            title: '',
            date: format(resetNow, 'yyyy-MM-dd'),
            startTime: format(resetNow, 'HH:mm'),
            endTime: format(addHours(resetNow, 1), 'HH:mm'),
            type: 'general',
            involvedActors: [],
            involvedAreas: [],
            notes: '',
            agreements: [],
            otherActorSpec: '',
        });
        onClose();
    };

    const handleSubmit = async () => {
        // Process actors to include "Others" specification
        const finalActors = formData.involvedActors.map(actor => {
            if (actor === 'Otros' && formData.otherActorSpec?.trim()) {
                return `Otros: ${formData.otherActorSpec.trim()}`;
            }
            return actor;
        });

        const payload = {
            title: formData.title,
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            type: formData.type,
            involvedActors: finalActors,
            involvedAreas: formData.involvedAreas,
            notes: formData.notes,
            tasks: formData.agreements.map(a => ({ description: a })),
        };

        await createMeeting.mutateAsync(payload);
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="sm:max-w-4xl h-[90vh] p-0 flex overflow-hidden gap-0 sm:rounded-xl border border-border shadow-none">
                <DialogTitle className="sr-only">Nueva Reunión</DialogTitle>
                <WizardLayout
                    title="Nueva Reunión"
                    description="Organiza y registra los detalles de tus reuniones institucionales."
                    onClose={handleClose}
                    className="h-full border-none"
                    contentClassName="bg-slate-50/30"
                >
                    {/* Header with Steps/Status if needed, or just spacers */}
                    <div className="shrink-0 px-8 pt-6 pb-4 border-b border-border bg-background flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black tracking-tight text-foreground">Detalles de la Reunión</h3>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-12 custom-scrollbar">
                        <div className="space-y-12 max-w-3xl mx-auto">
                            
                            {/* SECTION 1: CONFIGURACIÓN GENERAL */}
                            <section className="space-y-6">

                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Título de la Reunión</label>
                                        <Input
                                            placeholder="Ej: Planificación Anual, Coordinación de Área..."
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="h-11 rounded-lg border-border focus-visible:ring-primary/20 shadow-none font-medium"
                                            autoFocus
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Fecha</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                                            <Input
                                                type="date"
                                                value={formData.date}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                className="h-11 pl-10 rounded-lg border-border focus-visible:ring-primary/20 shadow-none text-foreground font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Tipo de Reunión</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setFormData({ ...formData, type: 'general' })}
                                                className={cn(
                                                    "flex-1 h-11 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all border active:scale-95 shadow-none",
                                                    formData.type === 'general'
                                                        ? "bg-primary/10 border-primary/30 text-primary"
                                                        : "bg-background border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                                                )}
                                            >
                                                <Users className="w-4 h-4" />
                                                General
                                            </button>
                                            <button
                                                onClick={() => setFormData({ ...formData, type: 'colegiada' })}
                                                className={cn(
                                                    "flex-1 h-11 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all border active:scale-95 shadow-none",
                                                    formData.type === 'colegiada'
                                                        ? "bg-primary/10 border-primary/30 text-primary"
                                                        : "bg-background border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                                                )}
                                            >
                                                <Briefcase className="w-4 h-4" />
                                                Colegiada
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 2: ACTORS */}
                            <section className="space-y-6">

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 block">Seleccionar Roles</label>
                                        {formData.involvedActors.length > 0 && (
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-wide bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20 shadow-none">
                                                {formData.involvedActors.length} SELECCIONADOS
                                            </span>
                                        )}
                                    </div>

                                    {/* Docentes Selection handling */}
                                    {!formData.involvedActors.includes('Docentes') && !formData.involvedActors.includes('Otros') ? (
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            {ACTORS.map(actor => (
                                                <button
                                                    key={actor.id}
                                                    type="button"
                                                    onClick={() => toggleActor(actor.id)}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 p-4 rounded-lg text-xs font-bold transition-all duration-200 border transform active:scale-95 shadow-none",
                                                        formData.involvedActors.includes(actor.id)
                                                            ? "bg-primary/10 border-primary/30 text-primary"
                                                            : "bg-background border-border hover:border-border/80 text-muted-foreground hover:bg-accent hover:text-foreground"
                                                    )}
                                                >
                                                    <actor.icon className={cn("h-5 w-5", formData.involvedActors.includes(actor.id) ? "text-primary" : "text-muted-foreground/60")} />
                                                    <span className="truncate w-full text-center">{actor.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Condensed Actors List when expanded */}
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {ACTORS.map(actor => (
                                                    <button
                                                        key={actor.id}
                                                        type="button"
                                                        onClick={() => toggleActor(actor.id)}
                                                        className={cn(
                                                            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 border active:scale-95 shadow-none",
                                                            formData.involvedActors.includes(actor.id)
                                                                ? "bg-primary/10 border-primary/30 text-primary"
                                                                : "bg-background border-border hover:border-border/80 text-muted-foreground hover:bg-accent hover:text-foreground"
                                                        )}
                                                    >
                                                        <actor.icon className={cn("h-4 w-4", formData.involvedActors.includes(actor.id) ? "text-primary" : "text-muted-foreground/60")} />
                                                        <span>{actor.label}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Areas Selection (when Docentes is selected) */}
                                            {formData.involvedActors.includes('Docentes') && (
                                                <div className="space-y-4 bg-background p-5 rounded-lg border border-border animate-in fade-in slide-in-from-top-2 shadow-none">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <GraduationCap className="h-4 w-4 text-primary" />
                                                        <span className="font-bold text-foreground text-sm">Selección de Áreas</span>
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Seleccionar Áreas Departamentales</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const allSelected = AREAS.every(a => formData.involvedAreas.includes(a));
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        involvedAreas: allSelected ? [] : [...AREAS]
                                                                    }));
                                                                }}
                                                                className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wide"
                                                            >
                                                                {AREAS.every(a => formData.involvedAreas.includes(a)) ? "Deseleccionar Todas" : "Seleccionar Todas"}
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {AREAS.map(area => (
                                                                <button
                                                                    key={area}
                                                                    type="button"
                                                                    onClick={() => toggleArea(area)}
                                                                    className={cn(
                                                                        "px-3 py-1.5 rounded-md text-xs font-bold transition-all border active:scale-95 shadow-none",
                                                                        formData.involvedAreas.includes(area)
                                                                            ? "bg-primary/10 text-primary border-primary/30"
                                                                            : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                                                                    )}
                                                                >
                                                                    {area}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Other Actors Specification */}
                                            {formData.involvedActors.includes('Otros') && (
                                                <div className="bg-background p-5 rounded-lg border border-border animate-in fade-in slide-in-from-top-2 shadow-none">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Sparkles className="h-4 w-4 text-primary" />
                                                        <span className="font-bold text-foreground text-sm">Especificar Otros Participantes</span>
                                                    </div>
                                                    <Input
                                                        placeholder="Especifique quiénes más participarán (ej. Padres de familia, Especialistas)..."
                                                        value={formData.otherActorSpec || ''}
                                                        onChange={e => setFormData({ ...formData, otherActorSpec: e.target.value })}
                                                        className="bg-background border-border focus-visible:ring-primary/20 shadow-none font-medium text-sm rounded-md"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* SECTION 3: ACUERDOS */}
                            <section className="space-y-6 pb-8">

                                <AgreementsEditor
                                    items={formData.agreements}
                                    onChange={(agreements) => setFormData(prev => ({ ...prev, agreements }))}
                                />
                            </section>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="shrink-0 px-8 py-5 border-t border-border bg-background flex items-center justify-end gap-3 z-10 w-full">
                        <Button
                            variant="ghost"
                            onClick={handleClose}
                            className="font-bold px-6 text-muted-foreground shadow-none"
                        >
                            Cancelar
                        </Button>

                        <Button
                            onClick={handleSubmit}
                            variant="jira"
                            disabled={createMeeting.isPending || !formData.title || formData.involvedActors.length === 0}
                            className="font-bold px-8 h-10 shadow-none"
                        >
                            {createMeeting.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    <span>Registrando...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    <span>Registrar Reunión</span>
                                </>
                            )}
                        </Button>
                    </div>
                </WizardLayout>
            </DialogContent>
        </Dialog>
    );
}

// Dynamic row-per-item agreements editor (Notion-style)
function AgreementsEditor({
    items,
    onChange,
}: {
    items: string[];
    onChange: (items: string[]) => void;
}) {
    // rows = existing items + one empty trailing row
    const rows = [...items, ''];
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const focusRow = useCallback((index: number) => {
        setTimeout(() => inputRefs.current[index]?.focus(), 0);
    }, []);

    const handleChange = (index: number, value: string) => {
        if (index === rows.length - 1) {
            // Typing in the empty tail row → append
            onChange([...items, value]);
        } else {
            onChange(items.map((item, i) => (i === index ? value : item)));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            focusRow(Math.min(index + 1, rows.length - 1));
        }
        if (e.key === 'Backspace' && e.currentTarget.value === '' && index < rows.length - 1) {
            e.preventDefault();
            onChange(items.filter((_, i) => i !== index));
            focusRow(Math.max(0, index - 1));
        }
    };

    const removeRow = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
        focusRow(Math.max(0, index - 1));
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Editor de Acuerdos</h3>
                {items.length > 0 && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md uppercase tracking-wide shadow-none">
                        {items.length} {items.length === 1 ? 'acuerdo' : 'acuerdos'}
                    </span>
                )}
            </div>

            <div className="space-y-0.5">
                {rows.map((row, index) => {
                    const isLast = index === rows.length - 1;
                    return (
                        <div key={index} className="group flex items-center gap-2">
                            <span className={cn(
                                'text-xs font-mono w-5 text-right shrink-0 select-none transition-colors mt-1',
                                isLast ? 'text-muted-foreground/30' : 'text-muted-foreground/50'
                            )}>
                                {isLast ? '+' : index + 1}
                            </span>
                            <div className="flex-1 flex items-center gap-2 group/input">
                                <input
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    type="text"
                                    value={row}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    placeholder={isLast ? 'Agregar acuerdo rápido...' : ''}
                                    className={cn(
                                        'flex-1 py-2 px-3 text-sm rounded-lg border outline-none transition-all shadow-none font-medium',
                                        isLast
                                            ? 'border-transparent bg-transparent text-muted-foreground placeholder:text-muted-foreground/40 focus:border-primary/30 focus:bg-primary/5 focus:text-foreground'
                                            : 'border-transparent bg-transparent text-foreground hover:bg-accent focus:bg-primary/5 focus:border-primary/30'
                                    )}
                                />
                                {!isLast && (
                                    <button
                                        type="button"
                                        onClick={() => removeRow(index)}
                                        className="opacity-0 group-hover/input:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all p-1 shrink-0"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
