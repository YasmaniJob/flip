import { CheckCircle2, Blocks, BookOpen, School, Landmark, MapPin, Info, ArrowRightLeft } from "lucide-react";
import { OnboardingData } from "./types";

interface StepConfirmacionProps {
    data: OnboardingData;
    isChanging?: boolean;
}

export function StepConfirmacion({ data, isChanging }: StepConfirmacionProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-2xl mx-auto">
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-2">
                    {isChanging ? (
                        <ArrowRightLeft size={36} className="text-primary" />
                    ) : (
                        <CheckCircle2 size={36} className="text-primary" />
                    )}
                </div>
            </div>

            <div className="bg-background rounded-2xl border-2 border-border/60 overflow-hidden transition-all hover:border-primary/30">
                <div className="p-6 md:p-8 space-y-8">
                    {/* nivel Section */}
                    <div className="flex items-start gap-5">
                        <div className={`mt-1 h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${data.nivel === 'primaria' ? 'bg-orange-50/50 text-orange-500 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/50' : 'bg-purple-50/50 text-purple-500 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/50'}`}>
                            {data.nivel === 'primaria' ? <Blocks size={24} /> : <BookOpen size={24} />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5">Nivel Educativo</p>
                            <p className="text-lg font-bold text-foreground capitalize">{data.nivel}</p>
                        </div>
                    </div>

                    <div className="h-px w-full bg-border/40" />

                    {/* Institution Section */}
                    <div className="flex items-start gap-5">
                        <div className="mt-1 h-12 w-12 rounded-xl bg-blue-50/50 text-blue-500 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                            <School size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5">Institución Educativa</p>
                            <p className="text-lg font-bold text-foreground tracking-tight leading-snug">{data.institution?.nombre}</p>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 text-[11px] font-bold text-muted-foreground/70">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10 text-primary font-mono tracking-tight">
                                    <span className="text-[8px] font-black opacity-60">CM</span>
                                    <span>{data.institution?.codigoModular}</span>
                                </div>
                                <span className="text-muted-foreground/20 hidden md:inline">•</span>
                                <div className="flex items-center gap-1.5">
                                    <Landmark size={13} className="text-primary/40 shrink-0" />
                                    <span>{data.institution?.distrito}, {data.institution?.provincia}</span>
                                </div>
                                {data.institution?.direccion && (
                                    <>
                                        <span className="text-muted-foreground/20 hidden md:inline">•</span>
                                        <div className="flex items-center gap-1.5 max-w-[280px]">
                                            <MapPin size={13} className="text-primary/40 shrink-0" />
                                            <span className="truncate font-medium">{data.institution.direccion}</span>
                                        </div>
                                    </>
                                )}
                                {data.isManual && (
                                    <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded uppercase font-black tracking-widest ml-auto">Manual</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-muted/30 p-5 border-t border-border/60">
                    <p className="text-[13px] font-medium text-muted-foreground flex items-center justify-center gap-2">
                        <Info size={16} className="text-primary/60" />
                        {isChanging 
                            ? 'Esta acción cambiará tu institución de trabajo.'
                            : 'Al comenzar, se configurará tu entorno con estos datos.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
