'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBulkCreatePedagogicalHours } from '@/features/settings/hooks/use-pedagogical-hours';
import { Check, Clock, Loader2, Wand2, ChevronUp, ChevronDown, Plus, Trash2, Settings2, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkCreateHoursDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    shift: 'mañana' | 'tarde';
    existingCount: number;
}

interface BreakRule {
    after: number;
    duration: number;
}

const NumberInput = ({ 
    label, 
    value, 
    onChange, 
    min = 0, 
    max = 100,
    className,
    compact = false
}: { 
    label?: string; 
    value: string | number; 
    onChange: (val: string) => void;
    min?: number;
    max?: number;
    className?: string;
    compact?: boolean;
}) => (
    <div className={cn("space-y-2 flex-1", className)}>
        {label && <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-0.5 leading-none">{label}</Label>}
        <div className="flex h-12 overflow-hidden rounded-md border border-border focus-within:border-primary/50 transition-all bg-white group">
            <Input 
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
                className={cn(
                    "flex-1 h-full border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all text-center font-black tabular-nums placeholder:text-muted-foreground/20 p-0 pl-7",
                    compact ? "text-base" : "text-xl"
                )}
                placeholder="0"
            />
            <div className="flex flex-col border-l border-border w-8 lg:w-10 shrink-0 bg-muted/5">
                <button 
                    onClick={() => onChange(String(Math.min(max, (Number(value) || 0) + 1)))} 
                    className="flex-1 flex items-center justify-center hover:bg-muted active:bg-muted-foreground/10 text-muted-foreground/40 hover:text-primary transition-colors border-b border-border/50 p-0"
                >
                    <ChevronUp className="size-4" />
                </button>
                <button 
                    onClick={() => onChange(String(Math.max(min, (Number(value) || 0) - 1)))} 
                    className="flex-1 flex items-center justify-center hover:bg-muted active:bg-muted-foreground/10 text-muted-foreground/40 hover:text-primary transition-colors p-0"
                >
                    <ChevronDown className="size-4" />
                </button>
            </div>
        </div>
    </div>
);

export function BulkCreateHoursDialog({
    open,
    onOpenChange,
    shift,
    existingCount,
}: BulkCreateHoursDialogProps) {
    const bulkMutation = useBulkCreatePedagogicalHours();
    
    // Configuration
    const [startTime, setStartTime] = useState(shift === 'mañana' ? '08:00' : '13:00');
    const [duration, setDuration] = useState(45);
    const [count, setCount] = useState(7);
    const [breaks, setBreaks] = useState<BreakRule[]>([{ after: 3, duration: 20 }]);
    const [activeTab, setActiveTab] = useState<'config' | 'preview'>('config');

    const startH = startTime.split(':')[0];
    const startM = startTime.split(':')[1];

    const handleHourChange = (val: string) => {
        const numeric = val.replace(/\D/g, '').slice(0, 2);
        if (numeric === '') {
            setStartTime(`00:${startM}`);
            return;
        }
        const hour = Math.min(23, Math.max(0, parseInt(numeric)));
        setStartTime(`${String(hour).padStart(2, '0')}:${startM}`);
    };

    const handleMinuteChange = (val: string) => {
        const numeric = val.replace(/\D/g, '').slice(0, 2);
        if (numeric === '') {
            setStartTime(`${startH}:00`);
            return;
        }
        const minute = Math.min(59, Math.max(0, parseInt(numeric)));
        setStartTime(`${startH}:${String(minute).padStart(2, '0')}`);
    };

    // Generated Preview
    const preview = useMemo(() => {
        const hours: any[] = [];
        let currentTotalMinutes = parseInt(startH) * 60 + parseInt(startM);

        for (let i = 0; i < count; i++) {
            const hStart = currentTotalMinutes;
            const hEnd = hStart + duration;
            const pedagogicalNumber = existingCount + i + 1;
            
            hours.push({
                name: `${pedagogicalNumber}° Hora`,
                startTime: `${String(Math.floor(hStart / 60)).padStart(2, '0')}:${String(hStart % 60).padStart(2, '0')}`,
                endTime: `${String(Math.floor(hEnd / 60)).padStart(2, '0')}:${String(hEnd % 60).padStart(2, '0')}`,
                order: existingCount + i,
                shift,
                isBreak: false,
                pedagogicalNumber
            });

            currentTotalMinutes = hEnd;

            // Check if there's a break after this hour
            const breakRule = breaks.find(b => b.after === (i + 1));
            if (breakRule) {
                const bStart = currentTotalMinutes;
                const bEnd = bStart + breakRule.duration;

                hours.push({
                    name: 'RECREO',
                    startTime: `${String(Math.floor(bStart / 60)).padStart(2, '0')}:${String(bStart % 60).padStart(2, '0')}`,
                    endTime: `${String(Math.floor(bEnd / 60)).padStart(2, '0')}:${String(bEnd % 60).padStart(2, '0')}`,
                    order: 0,
                    shift,
                    isBreak: true
                });

                currentTotalMinutes = bEnd;
            }
        }
        return hours;
    }, [startTime, duration, count, breaks, shift, existingCount]);

    const handleCreate = async () => {
        try {
            await bulkMutation.mutateAsync(preview);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        }
    };

    const addBreak = () => {
        setBreaks([...breaks, { after: Math.min(count, breaks.length + 1), duration: 15 }]);
    };

    const removeBreak = (idx: number) => {
        setBreaks(breaks.filter((_, i) => i !== idx));
    };

    const updateBreak = (idx: number, field: keyof BreakRule, value: number) => {
        const n = [...breaks];
        n[idx] = { ...n[idx], [field]: value };
        setBreaks(n);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                showCloseButton={false}
                className={cn(
                    "max-w-4xl sm:max-w-5xl p-0 overflow-hidden border border-border shadow-none bg-white transition-all duration-500",
                    "fixed bottom-0 left-0 right-0 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
                    "rounded-t-xl rounded-b-none sm:rounded-xl h-[85vh] max-h-[90vh] sm:max-h-full",
                    "flex flex-col animate-in slide-in-from-bottom-5 duration-500"
                )}
            >
                <div className="flex flex-col h-full relative">
                    <DialogTitle className="sr-only">Generador de Horario</DialogTitle>
                    <DialogDescription className="sr-only">Configuración institucional del cronograma pedagógico.</DialogDescription>
                    
                    <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-border/40 rounded-full z-10" />

                    <div className="flex items-center justify-between px-6 py-4 md:px-8 border-b border-border bg-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-[#0052cc] text-white shadow-none">
                                <Wand2 className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-[0.15em] text-foreground">Generador de Horarios</h2>
                            </div>
                        </div>
                        <div className={cn(
                            "px-4 py-1.5 rounded border text-[10px] font-black uppercase tracking-widest tabular-nums transition-colors",
                            shift === 'mañana' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        )}>
                            Turno {shift}
                        </div>
                    </div>

                    <div className="md:hidden flex p-1.5 bg-muted/20 border-b border-border gap-1.5">
                        <button 
                            onClick={() => setActiveTab('config')}
                            className={cn(
                                "flex-1 h-9 rounded text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'config' ? "bg-white text-[#0052cc] border border-border shadow-none" : "text-muted-foreground/60 hover:text-foreground"
                            )}
                        >
                            <Settings2 className="size-3.5 inline mr-1.5" />
                            Ajustes
                        </button>
                        <button 
                            onClick={() => setActiveTab('preview')}
                            className={cn(
                                "flex-1 h-9 rounded text-[10px] font-black uppercase tracking-widest transition-all relative",
                                activeTab === 'preview' ? "bg-white text-[#0052cc] border border-border shadow-none" : "text-muted-foreground/60 hover:text-foreground"
                            )}
                        >
                            <ListChecks className="size-3.5 inline mr-1.5" />
                            Previa
                            {preview.length > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 rounded bg-[#0052cc]/10 text-[#0052cc] text-[9px]">
                                    {preview.length}
                                </span>
                            )}
                        </button>
                    </div>

                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-x divide-border min-h-0 bg-white">
                            {/* Configuracion Column */}
                            <div className={cn(
                                "flex-1 md:w-[380px] md:flex-none flex flex-col min-h-0 transition-all duration-300",
                                activeTab !== 'config' && "hidden md:flex"
                            )}>
                            <div className={cn(
                                "flex-1 overflow-y-auto p-6 md:p-8 space-y-10 bg-muted/5 min-h-0 transition-colors",
                                "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
                                "[&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/10 [&::-webkit-scrollbar-thumb]:rounded-full"
                            )}>
                                <div className="space-y-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-px flex-1 bg-border/60" />
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 shrink-0">Punto de Partida</Label>
                                            <div className="h-px flex-1 bg-border/60" />
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 space-y-2.5">
                                                <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Horas</Label>
                                                <div className="flex h-14 overflow-hidden rounded-md border border-border bg-white focus-within:border-primary/50 transition-all group">
                                                    <Input 
                                                        value={startH} 
                                                        onChange={(e) => handleHourChange(e.target.value)}
                                                        className="flex-1 h-full border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all text-center text-3xl font-black tabular-nums p-0 pl-8"
                                                        maxLength={2}
                                                    />
                                                    <div className="flex flex-col border-l border-border w-10 shrink-0 bg-muted/5">
                                                        <button onClick={() => handleHourChange(String(Number(startH) + 1))} className="flex-1 flex items-center justify-center hover:bg-muted active:bg-muted-foreground/10 text-muted-foreground/40 hover:text-primary transition-colors border-b border-border/50 p-0"><ChevronUp className="size-4" /></button>
                                                        <button onClick={() => handleHourChange(String(Number(startH) - 1))} className="flex-1 flex items-center justify-center hover:bg-muted active:bg-muted-foreground/10 text-muted-foreground/40 hover:text-primary transition-colors p-0"><ChevronDown className="size-4" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-8 text-2xl font-black text-muted-foreground/10">:</div>
                                            <div className="flex-1 space-y-2.5">
                                                <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Minutos</Label>
                                                <div className="flex h-14 overflow-hidden rounded-md border border-border bg-white focus-within:border-primary/50 transition-all group">
                                                    <Input 
                                                        value={startM} 
                                                        onChange={(e) => handleMinuteChange(e.target.value)}
                                                        className="flex-1 h-full border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all text-center text-3xl font-black tabular-nums p-0 pl-8"
                                                        maxLength={2}
                                                    />
                                                    <div className="flex flex-col border-l border-border w-10 shrink-0 bg-muted/5">
                                                        <button onClick={() => handleMinuteChange(String(Number(startM) + 1))} className="flex-1 flex items-center justify-center hover:bg-muted active:bg-muted-foreground/10 text-muted-foreground/40 hover:text-primary transition-colors border-b border-border/50 p-0"><ChevronUp className="size-4" /></button>
                                                        <button onClick={() => handleMinuteChange(String(Number(startM) - 1))} className="flex-1 flex items-center justify-center hover:bg-muted active:bg-muted-foreground/10 text-muted-foreground/40 hover:text-primary transition-colors p-0"><ChevronDown className="size-4" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <NumberInput 
                                            label="Cant. de Horas" 
                                            value={count} 
                                            onChange={(val) => setCount(Number(val))} 
                                            min={1} 
                                            max={12} 
                                        />
                                        <NumberInput 
                                            label="Duración (min)" 
                                            value={duration} 
                                            onChange={(val) => setDuration(Number(val))} 
                                            min={5} 
                                            max={120} 
                                        />
                                    </div>

                                    <div className="space-y-6 pt-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-px flex-1 bg-border/60" />
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 shrink-0">Recesos y Descansos</Label>
                                            <div className="h-px flex-1 bg-border/60" />
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={addBreak}
                                                className="h-7 px-3 border border-primary/20 text-[#0052cc] hover:bg-[#0052cc]/5 text-[9px] font-black uppercase tracking-widest shadow-none"
                                            >
                                                <Plus className="size-3 mr-1" />
                                                Añadir
                                            </Button>
                                        </div>
                                        
                                        <div className={cn(
                                            "space-y-4 max-h-[300px] overflow-y-auto pr-2 transition-colors",
                                            "[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent",
                                            "[&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/10 [&::-webkit-scrollbar-thumb]:rounded-full"
                                        )}>
                                            {breaks.length === 0 ? (
                                                <div className="p-10 border border-dashed border-border rounded text-center opacity-30 bg-white">
                                                    <Clock className="size-5 mx-auto mb-2 text-muted-foreground" />
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em]">Cero interrupciones</p>
                                                </div>
                                            ) : (
                                                breaks.map((b, i) => (
                                                    <div key={i} className="bg-white p-4 rounded border border-border shadow-none flex items-end gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="flex-1">
                                                            <NumberInput 
                                                                label="Tras Hora" 
                                                                value={b.after} 
                                                                onChange={(val) => updateBreak(i, 'after', Number(val))} 
                                                                min={1} 
                                                                max={count} 
                                                                compact
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <NumberInput 
                                                                label="Minutos" 
                                                                value={b.duration} 
                                                                onChange={(val) => updateBreak(i, 'duration', Number(val))} 
                                                                min={5} 
                                                                max={120} 
                                                                compact
                                                            />
                                                        </div>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => removeBreak(i)}
                                                            className="h-10 w-10 text-muted-foreground/20 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-none shrink-0"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview Column */}
                        <div className={cn(
                            "flex-1 flex flex-col overflow-hidden bg-white",
                            activeTab !== 'preview' && "hidden md:flex"
                        )}>
                            <div className={cn(
                                "flex-1 overflow-y-auto p-6 md:p-8 bg-white pb-safe min-h-0 transition-colors",
                                "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
                                "[&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/10 [&::-webkit-scrollbar-thumb]:rounded-full"
                            )}>
                                <div className="space-y-4 w-full">
                                    {preview.length === 0 ? (
                                        <div className="h-[400px] flex flex-col items-center justify-center text-center p-12 opacity-20 select-none bg-muted/5 rounded border border-dashed border-border">
                                            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-6">
                                                <Clock className="size-8 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-xs font-black uppercase tracking-widest mb-2 text-foreground">Ajustes Requeridos</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest max-w-[200px]">Define los parámetros para previsualizar.</p>
                                        </div>
                                    ) : (
                                        preview.map((h, idx) => (
                                            <div 
                                                key={idx}
                                                className={cn(
                                                    "group flex items-center gap-6 p-5 rounded border transition-all animate-in fade-in slide-in-from-right-4 duration-300",
                                                    h.isBreak 
                                                        ? "bg-amber-50/50 border-amber-200" 
                                                        : "bg-white border-border hover:border-[#0052cc]/30 hover:bg-[#0052cc]/[0.01]"
                                                )}
                                                style={{ animationDelay: `${idx * 40}ms` }}
                                            >
                                                <div className={cn(
                                                    "size-12 rounded flex items-center justify-center font-black text-xs tabular-nums shrink-0 transition-transform group-hover:scale-105",
                                                    h.isBreak 
                                                        ? "bg-amber-100 text-amber-700 border border-amber-200" 
                                                        : "bg-muted/10 text-[#0052cc] border border-border shadow-none"
                                                )}>
                                                    {h.isBreak ? 'R' : `${h.pedagogicalNumber}°`}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className={cn("text-xs font-black tracking-tight uppercase truncate", h.isBreak ? "text-amber-900" : "text-foreground")}>
                                                        {h.name}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock className={cn("size-3", h.isBreak ? "text-amber-500/30" : "text-muted-foreground/20")} />
                                                        <span className={cn(
                                                            "text-[10px] font-bold tabular-nums uppercase tracking-[0.1em]",
                                                            h.isBreak ? "text-amber-600/60" : "text-muted-foreground/40"
                                                        )}>
                                                            {h.startTime} — {h.endTime}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className={cn(
                                                    "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded border tabular-nums transition-opacity select-none",
                                                    h.isBreak ? "border-amber-200/50 text-amber-700/50" : "border-border/50 text-muted-foreground/20"
                                                )}>
                                                    {h.isBreak ? 'R' : h.pedagogicalNumber}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 md:p-8 border-t border-border bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 mt-auto">
                        <Button 
                            variant="jira" 
                            size="lg"
                            className="w-full sm:flex-1 h-12 text-[11px] font-black uppercase tracking-[0.15em] gap-3 order-1 sm:order-2"
                            disabled={preview.length === 0 || bulkMutation.isPending}
                            onClick={handleCreate}
                        >
                            {bulkMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="h-4 w-4 stroke-[3]" />
                            )}
                            Sincronizar Todo
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => onOpenChange(false)}
                            className="w-full sm:w-auto px-8 h-12 text-[11px] font-black uppercase tracking-widest shadow-none text-muted-foreground hover:text-foreground order-2 sm:order-1 transition-all"
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
