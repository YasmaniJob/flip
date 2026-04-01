'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBulkCreatePedagogicalHours } from '@/features/settings/hooks/use-pedagogical-hours';
import { Check, Clock, Loader2, Wand2, ChevronUp, ChevronDown, Plus, Trash2, Settings2, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
                    "max-w-4xl sm:max-w-4xl p-0 overflow-hidden border border-border shadow-none bg-white transition-all duration-500",
                    "fixed bottom-0 left-0 right-0 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:right-auto",
                    "rounded-t-xl rounded-b-none sm:rounded-xl h-[85vh] sm:h-[85vh] max-h-[90vh] sm:max-h-[700px]",
                    "animate-in slide-in-from-bottom-5 duration-500"
                )}
            >
                <div className="flex flex-col h-full relative">
                    <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-border/40 rounded-full z-10" />
                    
                    {/* Header */}
                    <div className="p-6 border-b border-border bg-muted/10 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 transition-all hover:scale-105 shadow-none">
                                <Wand2 className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black uppercase tracking-tighter text-[#0052cc]">Generador de Horario</DialogTitle>
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="config" className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-4 md:px-8 border-b border-border bg-white shrink-0">
                            <TabsList className="flex items-center justify-start h-14 bg-transparent border-none p-0 gap-8">
                                <TabsTrigger 
                                    value="config" 
                                    className="h-full px-0 bg-transparent border-none rounded-none shadow-none text-[11px] font-black uppercase tracking-widest gap-2.5 text-muted-foreground/60 transition-all data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                                >
                                    <Settings2 className="size-4" />
                                    Ajustes
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="preview" 
                                    className="h-full px-0 bg-transparent border-none rounded-none shadow-none text-[11px] font-black uppercase tracking-widest gap-2.5 text-muted-foreground/60 transition-all data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                                >
                                    <ListChecks className="size-4" />
                                    Vista Previa
                                    {preview.length > 0 && (
                                        <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] tabular-nums font-black border border-primary/20">
                                            {preview.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-hidden relative">
                            <TabsContent value="config" className="h-full m-0 p-0 outline-none">
                                <div className="h-full overflow-y-auto p-4 md:p-8 space-y-8 pb-safe bg-muted/5 scrollbar-hide hover:scrollbar-default transition-all">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                        <div className="space-y-6">
                                            <div className="space-y-5">
                                                <Label className="text-[11px] font-black uppercase tracking-widest text-primary block leading-none">Punto de Partida</Label>
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
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
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
                                            
                                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 scrollbar-hide hover:scrollbar-default transition-all">
                                                {breaks.length === 0 ? (
                                                    <div className="p-8 border-2 border-dashed border-border/50 rounded-xl text-center opacity-40">
                                                        <Clock className="size-6 mx-auto mb-2 text-muted-foreground" />
                                                        <p className="text-[9px] font-black uppercase tracking-[0.2em]">Sin recesos añadidos</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {breaks.map((b, i) => (
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
                                                                className="h-10 w-10 text-muted-foreground/50 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-none shrink-0"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="preview" className="h-full m-0 p-0 outline-none">
                                <div className="h-full overflow-y-auto p-4 md:p-8 bg-white pb-safe scrollbar-hide hover:scrollbar-default transition-all">
                                    <div className="max-w-md mx-auto space-y-3">
                                        <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Cronograma Generado</Label>
                                            <span className="text-[9px] font-bold py-1 px-2 bg-muted rounded uppercase tracking-widest">{shift}</span>
                                        </div>
                                        {preview.map((h, idx) => (
                                            <div 
                                                key={idx}
                                                className={cn(
                                                    "flex items-center justify-between p-4 rounded-xl border transition-all animate-in fade-in slide-in-from-right-4 duration-300",
                                                    h.isBreak 
                                                        ? "bg-amber-50/40 border-amber-100/50" 
                                                        : "bg-white border-border/60 hover:border-primary/30 hover:bg-muted/5"
                                                )}
                                                style={{ animationDelay: `${idx * 40}ms` }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "size-9 rounded-lg flex items-center justify-center font-black text-xs tabular-nums transition-transform group-hover:scale-110",
                                                        h.isBreak ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary border border-primary/20"
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
                                                <div className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">{idx + 1}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>

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
