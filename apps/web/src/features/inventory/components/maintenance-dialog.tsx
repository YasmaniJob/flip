import { ActionConfirm } from '@/components/molecules/action-confirm';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Loader2, CheckCircle2, Sparkles, Check, AlertTriangle,
    Package, Calendar, Wrench, MessageSquarePlus, PenLine, User, Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLastDamageReport } from '../hooks/use-last-damage-report';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MaintenanceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { resolution: string; condition: string; status: string }) => Promise<void>;
    onSaveProgress?: (data: { resolution: string; maintenanceProgress: number; maintenanceState: Record<string, any> }) => Promise<void>;
    resourceName: string;
    resourceId?: string;
    initialMaintenanceState?: { completedDamageIds: (number | string)[]; completedSuggestionIds: (number | string)[] } | null;
}

const CONDITION_OPTIONS = [
    { value: 'nuevo',   label: 'Como Nuevo', icon: Sparkles,      description: 'Perfecto estado' },
    { value: 'bueno',   label: 'Bueno',      icon: Check,         description: 'Funcional'       },
    { value: 'regular', label: 'Regular',    icon: AlertTriangle, description: 'Con detalles'    },
];

export function MaintenanceDialog({
    isOpen, onClose, onConfirm, onSaveProgress,
    resourceName, resourceId, initialMaintenanceState,
}: MaintenanceDialogProps) {
    const [condition, setCondition] = useState('bueno');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDecommissionConfirm, setShowDecommissionConfirm] = useState(false);

    const [selectedDamages, setSelectedDamages] = useState<Set<number>>(() =>
        new Set((initialMaintenanceState?.completedDamageIds ?? []).map(Number))
    );
    const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(() =>
        new Set((initialMaintenanceState?.completedSuggestionIds ?? []).map(Number))
    );
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [openNoteId, setOpenNoteId] = useState<string | null>(null);

    const { data: damageReport, isLoading: isLoadingReport } = useLastDamageReport(resourceId);

    const totalItems = (damageReport?.damages?.length ?? 0) + (damageReport?.suggestions?.length ?? 0);
    const completedItems = selectedDamages.size + selectedSuggestions.size;
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const toggleDamage = (idx: number) => {
        const next = new Set(selectedDamages);
        next.has(idx) ? next.delete(idx) : next.add(idx);
        setSelectedDamages(next);
    };

    const toggleSuggestion = (idx: number) => {
        const next = new Set(selectedSuggestions);
        next.has(idx) ? next.delete(idx) : next.add(idx);
        setSelectedSuggestions(next);
    };

    const toggleNote = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenNoteId(openNoteId === id ? null : id);
    };

    const generateReport = () => {
        if (!damageReport) return '';
        const lines = [
            ...Array.from(selectedDamages).map(i => {
                const n = notes[`d-${i}`];
                return `- Reparado: "${damageReport.damages?.[i] ?? ''}"${n ? ` (${n})` : ''}`;
            }),
            ...Array.from(selectedSuggestions).map(i => {
                const n = notes[`s-${i}`];
                return `- Atendido: "${(damageReport.suggestions ?? [])[i] ?? ''}"${n ? ` (${n})` : ''}`;
            }),
        ];
        return lines.join('\n');
    };

    const handleSaveProgress = async () => {
        if (!onSaveProgress) return;
        setIsSubmitting(true);
        try {
            await onSaveProgress({
                resolution: generateReport(),
                maintenanceProgress: progress,
                maintenanceState: {
                    completedDamageIds: Array.from(selectedDamages),
                    completedSuggestionIds: Array.from(selectedSuggestions),
                },
            });
            onClose();
        } catch (e) { console.error(e); }
        finally { setIsSubmitting(false); }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm({ resolution: generateReport() || "Mantenimiento general realizado.", condition, status: 'disponible' });
            onClose();
        } catch (e) { console.error(e); }
        finally { setIsSubmitting(false); }
    };

    const confirmDecommission = async () => {
        setIsSubmitting(true);
        try {
            const r = generateReport();
            await onConfirm({
                resolution: r ? `DADO DE BAJA. Acciones intentadas:\n${r}` : "DADO DE BAJA por mantenimiento fallido.",
                condition: 'malo', status: 'baja',
            });
            onClose();
        } catch (e) { console.error(e); }
        finally { setIsSubmitting(false); setShowDecommissionConfirm(false); }
    };

    const hasReports = damageReport && totalItems > 0;
    const isValid = !hasReports || completedItems > 0;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
                <DialogContent showCloseButton={false} className="sm:max-w-2xl p-0 overflow-hidden border border-border shadow-none">

                    {/* Header */}
                    <div className="px-6 pt-6 pb-4 border-b border-border">
                        <div className="flex items-center gap-2 text-primary mb-1">
                            <Wrench className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Taller Técnico</span>
                        </div>
                        <DialogTitle className="text-lg font-black tracking-tight uppercase">Finalizar Mantenimiento</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">
                            Completa el reporte de intervención para habilitar el recurso o dictaminar su baja.
                        </DialogDescription>
                    </div>

                    {/* Resource info strip */}
                    <div className="px-6 py-3 bg-muted/20 border-b border-border flex items-center gap-3">
                        <div className="w-8 h-8 border border-border flex items-center justify-center text-muted-foreground shrink-0">
                            <Package className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Activo a intervenir</p>
                            <p className="text-sm font-black text-foreground truncate">{resourceName}</p>
                        </div>
                        {damageReport && (
                            <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                                <span className="flex items-center gap-1.5">
                                    <User className="w-3 h-3" />
                                    {damageReport.reportedBy}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    {damageReport.reportDate ? format(new Date(damageReport.reportDate), "d MMM yyyy", { locale: es }) : '—'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Scrollable body */}
                    <div className="overflow-y-auto max-h-[60vh] px-6 py-6 space-y-8">

                        {/* Progress bar — only when there are reports */}
                        {hasReports && (
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progreso de reparación</span>
                                    <span className="text-[10px] font-black text-primary">{progress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        {/* Reportes del préstamo */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[11px] font-black uppercase tracking-widest">Reportes del Último Préstamo</Label>
                                {hasReports && <span className="text-[10px] text-muted-foreground">Marca lo reparado/atendido</span>}
                            </div>

                            {isLoadingReport ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : hasReports ? (
                                <div className="space-y-5">
                                    {(damageReport.damages?.length ?? 0) > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black text-destructive uppercase tracking-widest">Fallas Críticas</span>
                                            {damageReport.damages!.map((damage, idx) => {
                                                const id = `d-${idx}`;
                                                const sel = selectedDamages.has(idx);
                                                const hasNote = !!notes[id];
                                                return (
                                                    <div key={id} className="flex flex-col gap-1">
                                                        <button type="button" onClick={() => toggleDamage(idx)}
                                                            className={cn("w-full flex items-start gap-3 p-3 border text-left transition-colors",
                                                                sel ? "bg-destructive/5 border-destructive/40" : "border-border hover:bg-muted/20"
                                                            )}>
                                                            <div className={cn("mt-0.5 w-4 h-4 border-2 flex items-center justify-center shrink-0",
                                                                sel ? "bg-destructive border-destructive text-white" : "border-border"
                                                            )}>
                                                                {sel && <Check className="w-3 h-3" />}
                                                            </div>
                                                            <p className={cn("flex-1 text-sm font-bold leading-tight", sel ? "text-destructive" : "text-foreground")}>{damage}</p>
                                                            <div onClick={(e) => toggleNote(id, e)}
                                                                className={cn("h-7 px-2 flex items-center gap-1.5 border shrink-0 transition-colors",
                                                                    hasNote ? "bg-primary/5 border-primary/30 text-primary" : "border-border text-muted-foreground hover:bg-muted/20"
                                                                )}>
                                                                {hasNote ? <PenLine className="h-3 w-3" /> : <MessageSquarePlus className="h-3 w-3" />}
                                                                <span className="text-[9px] font-black uppercase tracking-widest">{hasNote ? 'Edit' : 'Nota'}</span>
                                                            </div>
                                                        </button>
                                                        {openNoteId === id && (
                                                            <div className="pl-7 animate-in slide-in-from-top-1">
                                                                <Textarea autoFocus placeholder="Detalle lo que se reparó..."
                                                                    value={notes[id] || ''} onChange={(e) => setNotes(p => ({ ...p, [id]: e.target.value }))}
                                                                    className="min-h-[72px] text-xs bg-muted/20 border border-border focus-visible:ring-0 focus-visible:border-primary resize-y" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {(damageReport.suggestions?.length ?? 0) > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Observaciones</span>
                                            {(damageReport.suggestions ?? []).map((suggestion, idx) => {
                                                const id = `s-${idx}`;
                                                const sel = selectedSuggestions.has(idx);
                                                const hasNote = !!notes[id];
                                                return (
                                                    <div key={id} className="flex flex-col gap-1">
                                                        <button type="button" onClick={() => toggleSuggestion(idx)}
                                                            className={cn("w-full flex items-start gap-3 p-3 border text-left transition-colors",
                                                                sel ? "bg-primary/5 border-primary/40" : "border-border hover:bg-muted/20"
                                                            )}>
                                                            <div className={cn("mt-0.5 w-4 h-4 border-2 flex items-center justify-center shrink-0",
                                                                sel ? "bg-primary border-primary text-white" : "border-border"
                                                            )}>
                                                                {sel && <Check className="w-3 h-3" />}
                                                            </div>
                                                            <p className={cn("flex-1 text-sm font-bold leading-tight", sel ? "text-primary" : "text-foreground")}>{suggestion}</p>
                                                            <div onClick={(e) => toggleNote(id, e)}
                                                                className={cn("h-7 px-2 flex items-center gap-1.5 border shrink-0 transition-colors",
                                                                    hasNote ? "bg-primary/5 border-primary/30 text-primary" : "border-border text-muted-foreground hover:bg-muted/20"
                                                                )}>
                                                                {hasNote ? <PenLine className="h-3 w-3" /> : <MessageSquarePlus className="h-3 w-3" />}
                                                                <span className="text-[9px] font-black uppercase tracking-widest">{hasNote ? 'Edit' : 'Nota'}</span>
                                                            </div>
                                                        </button>
                                                        {openNoteId === id && (
                                                            <div className="pl-7 animate-in slide-in-from-top-1">
                                                                <Textarea autoFocus placeholder="Detalle la revisión realizada..."
                                                                    value={notes[id] || ''} onChange={(e) => setNotes(p => ({ ...p, [id]: e.target.value }))}
                                                                    className="min-h-[72px] text-xs bg-muted/20 border border-border focus-visible:ring-0 focus-visible:border-primary resize-y" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-muted/20 border border-dashed border-border p-8 flex flex-col items-center text-center">
                                    <CheckCircle2 className="h-7 w-7 text-muted-foreground/30 mb-2" />
                                    <p className="text-sm font-black uppercase tracking-tight">Sin Reporte de Daños</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">El activo no presenta fallas críticas registradas en su última bitácora.</p>
                                </div>
                            )}
                        </div>

                        {/* Dictamen técnico */}
                        <div className="space-y-3 pt-4 border-t border-border">
                            <Label className="text-[11px] font-black uppercase tracking-widest">Dictamen Técnico de Salida</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {CONDITION_OPTIONS.map(({ value, label, icon: Icon, description }) => {
                                    const sel = condition === value;
                                    const locked = !isValid && value !== 'malo';
                                    return (
                                        <button key={value} type="button" disabled={locked} onClick={() => setCondition(value)}
                                            className={cn("flex flex-col items-center justify-center p-4 border transition-colors text-center",
                                                locked ? "opacity-30 cursor-not-allowed" : "cursor-pointer",
                                                sel ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted/20 hover:border-primary/40 text-muted-foreground"
                                            )}>
                                            <Icon className={cn("mb-2 h-5 w-5", sel ? "text-primary" : "text-muted-foreground")} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                                            <span className="text-[10px] opacity-60 mt-0.5">{description}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Status Feedback Banner */}
                        {hasReports && progress < 100 && (
                            <div className="bg-amber-500/5 border border-amber-500/20 p-3 flex items-start gap-2 animate-in fade-in transition-all">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-amber-600 font-medium leading-relaxed">
                                    El recurso no puede marcarse como Disponible hasta que el progreso sea del 100%. Guarda el avance si falta refacción.
                                </p>
                            </div>
                        )}
                        {hasReports && progress === 100 && (
                            <div className="bg-primary/5 border border-primary/20 p-3 flex items-start gap-2 animate-in fade-in zoom-in-95 duration-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-relaxed">
                                    ¡Excelente! Has atendido todos los puntos críticos. El activo puede ser habilitado.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border flex justify-between items-center gap-3 bg-muted/10">
                        <Button type="button" variant="ghost"
                            className="text-destructive font-black uppercase tracking-widest text-[10px] hover:text-destructive hover:bg-destructive/5 -ml-2"
                            onClick={() => setShowDecommissionConfirm(true)} disabled={isSubmitting}>
                            Dar de Baja
                        </Button>
                        <div className="flex gap-2">
                            {onSaveProgress && (
                                <Button type="button" variant="outline"
                                    className="px-4 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                                    onClick={handleSaveProgress} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    Guardar Avance
                                </Button>
                            )}
                            <Button type="button" variant="default" onClick={handleSubmit}
                                disabled={!isValid || isSubmitting}
                                className="px-5 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 h-9">
                                {isSubmitting
                                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Habilitando...</>
                                    : <><span>Habilitar</span><CheckCircle2 className="h-3.5 w-3.5" /></>
                                }
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ActionConfirm
                open={showDecommissionConfirm}
                onOpenChange={setShowDecommissionConfirm}
                onConfirm={confirmDecommission}
                title="¿Confirmar baja del recurso?"
                description="Estás por cambiar el estado del activo a Baja. Esto lo inhabilitará permanentemente para préstamos y uso en talleres técnicos."
                confirmText="Confirmar baja"
                cancelText="Mantenimiento"
                variant="destructive"
                isLoading={isSubmitting}
            />
        </>
    );
}
