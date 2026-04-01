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
    max = 999,
    className,
    compact = false
}: { 
    label?: string, 
    value: number | string, 
    onChange: (val: string) => void,
    min?: number,
    max?: number,
    className?: string,
    compact?: boolean
}) => (
    <div className={cn("space-y-1.5 flex-1", className)}>
        {label && <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 leading-none">{label}</Label>}
        <div className="flex h-12 lg:h-14 overflow-hidden rounded-md border border-border focus-within:border-primary/50 transition-all bg-white group">
            <Input 
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
                className={cn(
                    "flex-1 h-full border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all text-center font-black tabular-nums placeholder:text-muted-foreground/20 p-0 pl-7 lg:pl-10",
                    compact ? "text-base lg:text-lg" : "text-xl lg:text-2xl"
                )}
                placeholder="0"
            />
            <div className="flex flex-col border-l border-border w-8 lg:w-10 shrink-0 bg-muted/5">
                <button 
                    onClick={() => onChange(String(Math.min(max, (Number(value) || 0) + 1)))} 
                    className="flex-1 flex items-center justify-center hover:bg-muted active:bg-muted-foreground/10 text-muted-foreground/40 hover:text-primary transition-colors border-b border-border/50 p-0"
                >
                    <ChevronUp className="size-4 lg:size-5" />
                </button>
                <button 
                    onClick={() => onChange(String(Math.max(min, (Number(value) || 0) - 1)))} 
                    className="flex-1 flex items-center justify-center hover:bg-muted active:bg-muted-foreground/10 text-muted-foreground/40 hover:text-primary transition-colors p-0"
                >
                    <ChevronDown className="size-4 lg:size-5" />
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
        const result = [];
        let currentStart = startTime;

        const addMinutes = (time: string, mins: number) => {
            const [h, m] = time.split(':').map(Number);
            const total = h * 60 + m + mins;
            const newH = Math.floor(total / 60) % 24;
            const newM = total % 60;
            return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
        };

        for (let i = 1; i <= count; i++) {
            const endTime = addMinutes(currentStart, duration);
            result.push({
                name: `${existingCount + i}° Hora`,
                startTime: currentStart,
                endTime: endTime,
                isBreak: false,
                sortOrder: existingCount + i - 1,
            });
            currentStart = endTime;

            const breakRule = breaks.find(b => b.after === i);
            if (breakRule && i < count) {
                const breakEnd = addMinutes(currentStart, breakRule.duration);
                result.push({
                    name: 'RECREO',
                    startTime: currentStart,
                    endTime: breakEnd,
                    isBreak: true,
                    sortOrder: existingCount + i,
                });
                currentStart = breakEnd;
            }
        }
        return result;
    }, [startTime, duration, count, breaks, existingCount]);

    const handleCreate = async () => {
        try {
            await bulkMutation.mutateAsync(preview);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        }
    };

    const addBreak = () => {
        setBreaks([...breaks, { after: count - 1, duration: 15 }]);
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
                showCloseButton={true}
                className={cn(
                    "max-w-4xl sm:max-w-5xl p-0 overflow-hidden border border-border shadow-none bg-white transition-all duration-500",
                    "fixed bottom-0 left-0 right-0 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:right-auto",
                    "rounded-t-xl rounded-b-none sm:rounded-xl h-[85vh] sm:h-[85vh] max-h-[90vh] sm:max-h-[750px]",
                    "animate-in slide-in-from-bottom-5 duration-500"
                )}
            >
                <div className="flex flex-col h-full relative">
                    <DialogTitle className="sr-only">Generador de Horario</DialogTitle>
                    <DialogDescription className="sr-only">Configura la generación masiva de horas pedagógicas y recesos.</DialogDescription>
                    
                    <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-border/40 rounded-full z-10" />
                    
                    {/* Mobile Only Header Tabs */}
                    <div className="md:hidden pt-6 px-4 pb-2 border-b border-border space-y-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-primary/10 text-primary">
                                <Wand2 className="size-4" />
                            </div>
                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#0052cc]">Generador</Label>
                        </div>
                        <div className="flex p-1 bg-muted/20 border border-border/50 rounded-lg gap-1">
                            <button 
                                onClick={() => setActiveTab('config')}
                                className={cn(
                                    "flex-1 h-9 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === 'config' ? "bg-white text-primary shadow-none" : "text-muted-foreground/60 hover:text-foreground"
                                )}
                            >
                                Ajustes
                            </button>
                            <button 
                                onClick={() => setActiveTab('preview')}
                                className={cn(
                                    "flex-1 h-9 rounded-md text-[10px] font-black uppercase tracking-widest transition-all relative",
                                    activeTab === 'preview' ? "bg-white text-primary shadow-none" : "text-muted-foreground/60 hover:text-foreground"
                                )}
                            >
                                Previa
                                {preview.length > 0 && (
                                    <span className={cn(
                                        "absolute -top-1 -right-1 size-4 rounded-full flex items-center justify-center text-[7px] font-black border-2 border-white",
                                        activeTab === 'preview' ? "bg-primary text-white" : "bg-muted-foreground text-white"
                                    )}>
                                        {preview.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-x divide-border">
                        {/* Configuracion Column */}
                        <div className={cn(
                            "flex-1 md:w-[420px] md:flex-none flex flex-col overflow-hidden transition-all duration-300",
                            activeTab !== 'config' && "hidden md:flex"
                        )}>
                            <div className="h-full overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide hover:scrollbar-default transition-all bg-muted/5">
                                <div className="space-y-6">
                                    <div className="hidden md:flex items-center gap-3 mb-4">
                                        <div className="p-2.5 rounded-lg bg-primary text-white">
                                            <Settings2 className="size-5" />
                                        </div>
                                        <div>
                                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-primary">Configuración</Label>
                                            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-0.5">Parámetros operativos</p>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-[#0052cc] block leading-none">Punto de Partida</Label>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 space-y-2">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 block">Horas</Label>
                                                <div className="flex h-14 overflow-hidden rounded-md border border-border focus-within:border-primary/50 transition-all bg-white group">
                                                    <Input 
                                                        value={startH} 
                                                        onChange={(e) => handleHourChange(e.target.value)}
                                                        className="flex-1 h-full border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all text-center text-xl lg:text-2xl font-black tabular-nums p-0 pl-8 lg:pl-10"
                                                        maxLength={2}
                                                    />
                                                    <div className="flex flex-col border-l border-border w-8 lg:w-10 shrink-0 bg-muted/5">
                                                        <button onClick={() => handleHourChange(String(Number(startH) + 1))} className="flex-1 flex items-center justify-center hover:bg-muted active:bg-muted-foreground/10 text-muted-foreground/40 hover:text-primary transition-colors border-b border-border/50 p-0"><ChevronUp className="size-4 lg:size-5" /></button>
                                                        <button onClick={() => handleHourChange(String(Number(startH) - 1))} className="flex-1 flex items-center justify-center hover:bg-muted active:bg-muted-foreground/10 text-muted-foreground/40 hover:text-primary transition-colors p-0"><ChevronDown className="size-4 lg:size-5" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-7 text-2xl font-black text-muted-foreground/40">:</div>
                                            <div className="flex-1 space-y-2">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 block">Minutos</Label>
                                                <div className="flex h-14 overflow-hidden rounded-md border border-border focus-within:border-primary/50 transition-all bg-white group">
                                                    <Input 
                                                        value={startM} 
                                                        onChange={(e) => handleMinuteChange(e.target.value)}
                                                        className="flex-1 h-full border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all text-center text-xl lg:text-2xl font-black tabular-nums p-0 pl-8 lg:pl-10"
                                                        maxLength={2}
                                                    />
                                                    <div className="flex flex-col border-l border-border w-8 lg:w-10 shrink-0 bg-muted/5">
                                                        <button onClick={() => handleMinuteChange(String(Number(startM) + 1))} className="flex-1 flex items-center justify-center hover:bg-muted active:bg-muted-foreground/10 text-muted-foreground/40 hover:text-primary transition-colors border-b border-border/50 p-0"><ChevronUp className="size-4 lg:size-5" /></button>
                                                        <button onClick={() => handleMinuteChange(String(Number(startM) - 1))} className="flex-1 flex items-center justify-center hover:bg-muted active:bg-muted-foreground/10 text-muted-foreground/40 hover:text-primary transition-colors p-0"><ChevronDown className="size-4 lg:size-5" /></button>
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
                                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#0052cc]">Recesos y Descansos</Label>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={addBreak}
                                                className="h-7 px-3 border-dashed border-primary/30 text-primary hover:bg-primary/5 text-[9px] font-black uppercase tracking-widest shadow-none"
                                            >
                                                <Plus className="size-3 mr-1" />
                                                Añadir
                                            </Button>
                                        </div>
                                        
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide hover:scrollbar-default transition-all">
                                            {breaks.length === 0 ? (
                                                <div className="p-8 border border-dashed border-border rounded-xl text-center opacity-40 bg-white">
                                                    <Clock className="size-6 mx-auto mb-2 text-muted-foreground" />
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em]">Sin recesos activos</p>
                                                </div>
                                            ) : (
                                                breaks.map((b, i) => (
                                                    <div key={i} className="bg-white p-3 rounded-lg border border-border shadow-none flex items-end gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
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
                                                            className="h-11 w-11 text-muted-foreground/50 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-none shrink-0"
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
                            <div className="hidden md:flex items-center justify-between px-8 h-20 border-b border-border shrink-0 bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-lg bg-emerald-500 text-white shadow-none">
                                        <ListChecks className="size-5" />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Vista Previa</Label>
                                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-0.5">Sincronizado — {preview.length} sesiones</p>
                                    </div>
                                </div>
                                <div className="px-5 py-2.5 rounded-md bg-muted/40 border border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground tabular-nums">
                                    {shift}
                                </div>
                            </div>

                            <div className="h-full overflow-y-auto p-4 md:p-8 bg-white pb-safe scrollbar-hide hover:scrollbar-default transition-all">
                                <div className="max-w-md mx-auto space-y-3">
                                    {preview.length === 0 ? (
                                        <div className="h-[400px] flex flex-col items-center justify-center text-center p-12 opacity-30 select-none">
                                            <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-6 animate-pulse">
                                                <Clock className="size-10 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-xs font-black uppercase tracking-widest mb-2 text-foreground">Sin Cronograma</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest max-w-[200px]">Ajusta los parámetros para generar el cronograma.</p>
                                        </div>
                                    ) : (
                                        preview.map((h, idx) => (
                                            <div 
                                                key={idx}
                                                className={cn(
                                                    "group flex items-center justify-between p-4 rounded-xl border transition-all animate-in fade-in slide-in-from-right-4 duration-300",
                                                    h.isBreak 
                                                        ? "bg-amber-50/40 border-amber-100/50" 
                                                        : "bg-white border-border/60 hover:border-primary/30 hover:bg-muted/5"
                                                )}
                                                style={{ animationDelay: `${idx * 40}ms` }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "size-10 rounded-lg flex items-center justify-center font-black text-xs tabular-nums transition-transform group-hover:scale-110",
                                                        h.isBreak ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary border border-primary/20 shadow-none"
                                                    )}>
                                                        {h.isBreak ? 'R' : `${idx + 1}°`}
                                                    </div>
                                                    <div>
                                                        <div className={cn("text-xs font-black tracking-tight", h.isBreak ? "text-amber-800" : "text-foreground")}>
                                                            {h.name}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-muted-foreground/60 tabular-nums uppercase tracking-widest mt-0.5">
                                                            {h.startTime} — {h.endTime}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-[9px] font-black text-muted-foreground/10 uppercase tracking-[0.2em] transition-opacity select-none">{idx + 1}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 md:p-8 border-t border-border bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 mt-auto">
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
                            Crear Horario Completo
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => onOpenChange(false)}
                            className="w-full sm:w-auto px-8 h-12 text-[11px] font-black uppercase tracking-widest shadow-none text-muted-foreground hover:text-foreground order-2 sm:order-1 transition-all"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
