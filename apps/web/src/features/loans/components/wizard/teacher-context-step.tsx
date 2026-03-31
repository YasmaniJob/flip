'use client';

import { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfigLoadout } from "@/features/settings/hooks/use-config-loadout";
import { useMemo } from "react";

interface TeacherContextStepProps {
    gradeId?: string | null;
    sectionId?: string | null;
    curricularAreaId?: string | null;
    onGradeChange: (id: string) => void;
    onSectionChange: (id: string) => void;
    onCurricularAreaChange: (id: string) => void;
    onSearchOpenChange?: (open: boolean) => void;
}

export function TeacherContextStep({
    gradeId, sectionId, curricularAreaId,
    onGradeChange, onSectionChange, onCurricularAreaChange, onSearchOpenChange,
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
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Curricular Area */}
            <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1 text-center">Seleccionar Área Curricular</label>
                <div className="grid grid-cols-1 gap-2">
                    {curricularAreas?.map((area) => (
                        <button
                            key={area.id}
                            onClick={() => onCurricularAreaChange(area.id)}
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-md transition-all text-left border shadow-none",
                                curricularAreaId === area.id
                                    ? "bg-foreground text-background border-foreground"
                                    : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                            )}
                        >
                            <BookOpen className="h-4 w-4 shrink-0" />
                            <span className="text-xs font-black uppercase tracking-widest">{area.name}</span>
                            {curricularAreaId === area.id && <Check className="h-4 w-4 ml-auto" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grade & Section */}
            <div className="pt-8 border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1 text-center">Grado</label>
                    <div className="grid grid-cols-5 gap-2">
                        {grades?.map((grade) => (
                            <button key={grade.id} onClick={() => onGradeChange(grade.id)}
                                className={cn("h-12 text-xs font-black rounded-md transition-all border uppercase shadow-none",
                                    gradeId === grade.id
                                        ? "bg-foreground text-background border-foreground"
                                        : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                                )}
                            >{grade.name.replace('Grado', '').trim()}G</button>
                        ))}
                    </div>
                </div>

                {gradeId && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1 text-center">Sección</label>
                        <div className="flex flex-wrap justify-center gap-2">
                            {sections?.map((section) => (
                                <button key={section.id} onClick={() => onSectionChange(section.id)}
                                    className={cn("h-12 w-12 text-xs font-black rounded-md transition-all border uppercase shadow-none",
                                        sectionId === section.id
                                            ? "bg-foreground text-background border-foreground scale-110"
                                            : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                                    )}
                                >{section.name}</button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

import { Check } from "lucide-react";
