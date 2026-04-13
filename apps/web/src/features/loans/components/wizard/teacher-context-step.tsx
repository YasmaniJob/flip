'use client';

import { useState } from "react";
import { Search, BookOpen, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfigLoadout } from "@/features/settings/hooks/use-config-loadout";
import { useMemo } from "react";
import { motion } from "framer-motion";

interface TeacherContextStepProps {
    gradeId?: string | null;
    sectionId?: string | null;
    curricularAreaId?: string | null;
    onGradeChange: (id: string) => void;
    onSectionChange: (id: string) => void;
    onCurricularAreaChange: (id: string) => void;
    onSearchOpenChange?: (open: boolean) => void;
    loanPurpose?: 'CLASS' | 'EVENT';
    purposeDetails?: string;
    onPurposeChange?: (purpose: 'CLASS' | 'EVENT') => void;
    onPurposeDetailsChange?: (details: string) => void;
}

export function TeacherContextStep({
    gradeId, sectionId, curricularAreaId,
    onGradeChange, onSectionChange, onCurricularAreaChange, onSearchOpenChange,
    loanPurpose = 'CLASS',
    purposeDetails = '',
    onPurposeChange,
    onPurposeDetailsChange,
}: TeacherContextStepProps) {
    const [openArea, setOpenArea] = useState(false);
    const [areaSearch, setAreaSearch] = useState("");
    const { data: config } = useConfigLoadout();
    const grades = config?.grades;
    const curricularAreas = config?.curricularAreas;

    // Use Memoized filter for sections (Efficiency + consistency with reservation modal)
    const sections = useMemo(() => {
        if (!config?.sections || !gradeId) return [];
        return config.sections.filter(s => s.gradeId === gradeId);
    }, [config?.sections, gradeId]);
    const filteredAreas = curricularAreas?.filter(a => a.name.toLowerCase().includes(areaSearch.toLowerCase()));

    if (openArea) {
        return (
            <div className="flex-1 min-h-0 flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="relative mb-4 shrink-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        autoFocus
                        placeholder="Buscar área..."
                        value={areaSearch}
                        onChange={(e) => setAreaSearch(e.target.value)}
                        className="w-full bg-muted/20 border border-border rounded-md h-10 pl-10 pr-20 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/30"
                    />
                    <button
                        onClick={() => { setOpenArea(false); setAreaSearch(""); onSearchOpenChange?.(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >Cancelar</button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    {filteredAreas?.map((area) => (
                        <button key={area.id}
                            onClick={() => { onCurricularAreaChange(area.id); setOpenArea(false); setAreaSearch(""); onSearchOpenChange?.(false); }}
                            className={cn("w-full flex items-center gap-3 p-3 rounded-md transition-all text-left border shadow-none",
                                curricularAreaId === area.id
                                    ? "bg-primary/5 border-primary/20"
                                    : "bg-background border-transparent hover:bg-muted/50 hover:border-border"
                            )}
                        >
                            <div className={cn("w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 border",
                                curricularAreaId === area.id ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                            )}>{area.name.slice(0, 2).toUpperCase()}</div>
                            <span className={cn("text-xs font-bold truncate", curricularAreaId === area.id ? "text-primary" : "text-foreground")}>{area.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Tabs de Propósito (Jira Flat) */}
            <div className="flex p-1 bg-muted/20 border border-border rounded-md w-full max-w-sm mx-auto">
                <button
                    onClick={() => onPurposeChange?.('CLASS')}
                    className={cn(
                        "flex-1 py-1.5 text-[11px] font-black uppercase tracking-widest rounded transition-all border",
                        loanPurpose === 'CLASS'
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
                    )}
                >
                    📚 Clase Regular
                </button>
                <button
                    onClick={() => onPurposeChange?.('EVENT')}
                    className={cn(
                        "flex-1 py-1.5 text-[11px] font-black uppercase tracking-widest rounded transition-all border",
                        loanPurpose === 'EVENT'
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
                    )}
                >
                    🎯 Uso General
                </button>
            </div>

            {/* Contenido según Propósito */}
            <div className="relative">
                {loanPurpose === 'CLASS' ? (
                    <motion.div
                        key="class"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row gap-6 lg:gap-8"
                    >
                        {/* Panel Izquierdo: Áreas Curriculares */}
                        {(curricularAreas && curricularAreas.length > 0) && (
                            <div className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border pb-5 md:pb-0 md:pr-6 md:max-h-[280px] overflow-y-auto custom-scrollbar">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-3 px-1">
                                    Área Curricular
                                </label>
                                <div className="space-y-0.5">
                                    {curricularAreas?.map((area) => (
                                        <button
                                            key={area.id}
                                            onClick={() => onCurricularAreaChange(area.id)}
                                            className={cn(
                                                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all text-left",
                                                curricularAreaId === area.id
                                                    ? "bg-primary/5 text-primary font-bold"
                                                    : "text-muted-foreground hover:bg-muted/30"
                                            )}
                                        >
                                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", curricularAreaId === area.id ? "bg-primary" : "bg-current opacity-40")} />
                                            <span className="text-[11px] uppercase tracking-widest flex-1 truncate">{area.name}</span>
                                            {curricularAreaId === area.id && <Check className="h-3 w-3 shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Panel Derecho: Grados y Secciones */}
                        <div className={cn("flex-1 space-y-3", !(curricularAreas && curricularAreas.length > 0) ? "max-w-xl mx-auto" : "")}>
                            {/* Grado */}
                            <div className={cn(
                                "p-4 rounded-md border transition-all duration-200",
                                !gradeId ? "border-primary/50 bg-primary/5" : "border-border bg-background"
                            )}>
                                <div className="flex items-center justify-between mb-3">
                                    <label className={cn("text-[10px] font-black uppercase tracking-widest", !gradeId ? "text-primary" : "text-muted-foreground")}>
                                        Grado
                                    </label>
                                    {gradeId && <Check className="h-3.5 w-3.5 text-primary" />}
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                                    {grades?.map((grade) => (
                                        <button
                                            key={grade.id}
                                            onClick={() => onGradeChange(grade.id)}
                                            className={cn(
                                                "h-9 text-[11px] font-black rounded-md transition-all border uppercase",
                                                gradeId === grade.id
                                                    ? "bg-foreground text-background border-foreground"
                                                    : "bg-background text-muted-foreground border-border hover:bg-muted/20 hover:border-foreground/30"
                                            )}
                                        >
                                            {grade.name.replace('Grado', '').trim()}G
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sección */}
                            <div className={cn(
                                "p-4 rounded-md border transition-all duration-200",
                                !gradeId ? "opacity-40 pointer-events-none border-border bg-muted/20" :
                                (gradeId && !sectionId) ? "border-primary/50 bg-primary/5" : "border-border bg-background"
                            )}>
                                <div className="flex items-center justify-between mb-3">
                                    <label className={cn("text-[10px] font-black uppercase tracking-widest", (gradeId && !sectionId) ? "text-primary" : "text-muted-foreground")}>
                                        Sección
                                    </label>
                                    {sectionId && <Check className="h-3.5 w-3.5 text-primary" />}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {gradeId && sections?.map((section) => (
                                        <button
                                            key={section.id}
                                            onClick={() => onSectionChange(section.id)}
                                            className={cn(
                                                "h-9 w-9 text-[11px] font-black rounded-md transition-all border uppercase",
                                                sectionId === section.id
                                                    ? "bg-foreground text-background border-foreground"
                                                    : "bg-background text-muted-foreground border-border hover:bg-muted/20 hover:border-foreground/30"
                                            )}
                                        >
                                            {section.name}
                                        </button>
                                    ))}
                                    {(!sections || sections.length === 0) && gradeId && (
                                        <p className="text-xs text-muted-foreground font-medium flex items-center h-9">Buscando secciones...</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="event"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 max-w-2xl mx-auto"
                    >
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1 text-center">
                            Motivo, Destino o Actividad
                        </label>
                        <textarea
                            value={purposeDetails}
                            onChange={(e) => onPurposeDetailsChange?.(e.target.value)}
                            placeholder="Ej. Auditorio principal, Día del Logro, Mantenimiento preventivo..."
                            className="w-full h-32 p-4 bg-muted/10 border border-border rounded-md text-sm text-foreground outline-none focus:bg-background focus:border-primary/50 transition-all resize-none shadow-none"
                        />
                    </motion.div>
                )}
            </div>
        </div>
    );
}
