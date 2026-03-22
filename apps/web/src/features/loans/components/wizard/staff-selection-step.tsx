"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Search, User, BookOpen, SearchX } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Staff } from "../../types";
import { useStaff, useRecurrentStaff } from "@/features/staff/hooks/use-staff";
import { useDebounce } from "@/hooks/use-debounce";
import { useGrades } from "@/features/settings/hooks/use-grades";
import { useSections } from "@/features/settings/hooks/use-sections";
import { useCurricularAreas } from "@/features/settings/hooks/use-curricular-areas";

interface StaffSelectionStepProps {
    onSelect: (staff: Staff | null) => void;
    selectedStaff: Staff | null;
    gradeId?: string | null;
    sectionId?: string | null;
    curricularAreaId?: string | null;
    onGradeChange: (gradeId: string) => void;
    onSectionChange: (sectionId: string) => void;
    onCurricularAreaChange: (areaId: string) => void;
    loanPurpose?: 'CLASS' | 'EVENT';
    purposeDetails?: string;
    onPurposeChange?: (purpose: 'CLASS' | 'EVENT') => void;
    onPurposeDetailsChange?: (details: string) => void;
    onSearchOpenChange?: (open: boolean) => void;
    inline?: boolean;
    discovery?: boolean;
}

export function StaffSelectionStep({
    onSelect,
    selectedStaff,
    gradeId,
    sectionId,
    curricularAreaId,
    onGradeChange,
    onSectionChange,
    onCurricularAreaChange,
    loanPurpose = 'CLASS',
    purposeDetails = '',
    onPurposeChange,
    onPurposeDetailsChange,
    onSearchOpenChange,
    inline = false,
    discovery = false,
}: StaffSelectionStepProps) {
    const [openStaff, setOpenStaff] = useState(false);
    const [staffSearch, setStaffSearch] = useState("");
    const debouncedStaffSearch = useDebounce(staffSearch, 500);

    const [openArea, setOpenArea] = useState(false);
    const [areaSearch, setAreaSearch] = useState("");

    // We use the hook's search capability
    const { staff, isLoading: isLoadingStaff } = useStaff({ search: debouncedStaffSearch, limit: 20 });
    const { data: recurrentStaff, isLoading: isLoadingRecurrent } = useRecurrentStaff(6);

    const { data: grades } = useGrades();
    const { data: sections } = useSections(gradeId || undefined);
    const { data: curricularAreas } = useCurricularAreas({ activeOnly: true });

    const filteredAreas = curricularAreas?.filter(area =>
        area.name.toLowerCase().includes(areaSearch.toLowerCase())
    );


    // View: Discovery Canvas (Onboarding-style)
    if (discovery) {
        return (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 1. Staff: Hero seleccionado o buscador */}
                <div>
                    {selectedStaff ? (
                        <div className="flex items-center gap-5 p-5 rounded-md border border-border bg-muted/20 border-l-[3px] border-l-primary animate-in fade-in zoom-in-95 duration-300">
                            <div className="w-14 h-14 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-lg font-black shrink-0 tracking-tight">
                                {selectedStaff.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xl font-black uppercase tracking-tight text-foreground truncate leading-tight">
                                    {selectedStaff.name}
                                </p>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                    {selectedStaff.role}
                                </p>
                            </div>
                            <button
                                onClick={() => onSelect(null)}
                                className="shrink-0 text-[10px] font-black text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors px-3 py-1.5 border border-border hover:border-foreground/30 rounded-md"
                            >
                                Cambiar
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative group max-w-2xl mx-auto">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    autoFocus={!selectedStaff}
                                    placeholder="Buscar docente o administrativo..."
                                    value={staffSearch}
                                    onChange={(e) => setStaffSearch(e.target.value)}
                                    className="w-full pl-14 pr-14 py-4 rounded-xl border-2 border-border bg-background text-base font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-muted-foreground/40 placeholder:font-medium"
                                />
                                {(isLoadingStaff || staffSearch !== debouncedStaffSearch) && (
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                        <span className="h-5 w-5 border-3 border-border border-t-primary rounded-full animate-spin inline-block" />
                                    </div>
                                )}
                            </div>

                            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {(isLoadingStaff || staffSearch !== debouncedStaffSearch) ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <motion.div 
                                            key={`skeleton-${i}`} 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.2, delay: i * 0.02 }}
                                            className="h-[68px] rounded-xl border-2 border-border/50 bg-muted/20 animate-pulse" 
                                        />
                                    ))
                                ) : !staff?.length && staffSearch ? (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="col-span-2 md:col-span-3 flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-border/60 rounded-xl bg-muted/5 text-center min-h-[200px]"
                                    >
                                        <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground/40">
                                            <SearchX size={24} />
                                        </div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">
                                            Sin resultados para "{staffSearch}"
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-medium">
                                            Intenta con otro nombre, apellido o cargo
                                        </p>
                                    </motion.div>
                                ) : !staffSearch ? (
                                    <>
                                      {/* Sugerencias de usuarios recurrentes */}
                                      {isLoadingRecurrent ? (
                                          Array.from({ length: 6 }).map((_, i) => (
                                              <motion.div 
                                                  key={`skeleton-rec-${i}`} 
                                                  initial={{ opacity: 0, scale: 0.95 }}
                                                  animate={{ opacity: 1, scale: 1 }}
                                                  transition={{ duration: 0.2, delay: i * 0.02 }}
                                                  className="h-[68px] rounded-xl border-2 border-border/50 bg-muted/20 animate-pulse" 
                                              />
                                          ))
                                      ) : recurrentStaff?.length === 0 ? (
                                          <div className="col-span-2 md:col-span-3 text-center py-8">
                                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">Comienza buscando un docente</p>
                                          </div>
                                      ) : recurrentStaff?.map((s, index) => {
                                          const initials = s.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
                                          return (
                                              <motion.button
                                                  key={s.id}
                                                  initial={{ opacity: 0, scale: 0.95 }}
                                                  animate={{ opacity: 1, scale: 1 }}
                                                  transition={{ duration: 0.2, delay: (index % 6) * 0.02 }}
                                                  onClick={() => onSelect(s)}
                                                  className="group flex items-center gap-4 p-3.5 rounded-xl transition-all text-left border-2 bg-background border-border hover:border-primary/40 hover:bg-primary/5"
                                              >
                                                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 border-2 bg-muted/50 text-foreground border-border group-hover:border-primary/30 group-hover:bg-background transition-colors">
                                                      {initials}
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                      <p className="text-xs font-black uppercase truncate tracking-tight text-foreground group-hover:text-primary transition-colors">
                                                          {s.name}
                                                      </p>
                                                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate mt-0.5">{s.role}</p>
                                                  </div>
                                              </motion.button>
                                          );
                                      })}
                                    </>
                                ) : (
                                    staff?.map((s, index) => {
                                        const initials = s.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
                                        return (
                                            <motion.button
                                                key={s.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.2, delay: (index % 20) * 0.02 }}
                                                onClick={() => onSelect(s)}
                                                className="group flex items-center gap-4 p-3.5 rounded-xl transition-all text-left border-2 bg-background border-border hover:border-primary/40 hover:bg-primary/5"
                                            >
                                                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 border-2 bg-muted/50 text-foreground border-border group-hover:border-primary/30 group-hover:bg-background transition-colors">
                                                    {initials}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-black uppercase truncate tracking-tight text-foreground group-hover:text-primary transition-colors">
                                                        {s.name}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate mt-0.5">{s.role}</p>
                                                </div>
                                            </motion.button>
                                        );
                                    })
                                )}
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* 2. Context Discovery (Visible once staff is selected) */}
                {/* 2. Context Discovery (Visible once staff is selected) */}
                {selectedStaff && (
                    <div className="pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2 w-full">
                        
                        {/* Tabs de Propósito (Jira Flat) */}
                        <div className="flex p-1 bg-muted/20 border border-border rounded-md w-full max-w-sm mb-6 mx-auto">
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
                                                {sections?.map((section) => (
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
                )}
            </div>
        );
    }

    // View: Search View (Staff or Area)
    if (openStaff || openArea) {
        const title = openStaff ? "Personal" : "Área Curricular";
        const placeholder = openStaff ? "Buscar personal..." : "Buscar área...";
        const searchValue = openStaff ? staffSearch : areaSearch;
        const setSearchValue = openStaff ? setStaffSearch : setAreaSearch;
        const isLoading = openStaff ? isLoadingStaff : false;
        const results = openStaff ? staff : filteredAreas;

        return (
            <div className="flex-1 min-h-0 flex flex-col animate-in fade-in slide-in-from-right-1 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => { setOpenStaff(false); setOpenArea(false); onSearchOpenChange?.(false); }}
                        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                        Volver al Manifiesto
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-border">
                        {title}
                    </span>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                        autoFocus
                        placeholder={placeholder}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="w-full bg-background border border-border rounded-md h-9 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/30 transition-all font-medium"
                    />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    {isLoading ? (
                        <div className="py-8 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cargando</div>
                    ) : results?.length === 0 ? (
                        <div className="py-8 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sin resultados</div>
                    ) : (
                        results?.map((item: any) => {
                            const isSelected = openStaff ? selectedStaff?.id === item.id : curricularAreaId === item.id;
                            const initials = item.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        if (openStaff) onSelect(item);
                                        else onCurricularAreaChange?.(item.id);
                                        setOpenStaff(false);
                                        setOpenArea(false);
                                        onSearchOpenChange?.(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-2 rounded-md transition-all text-left border shadow-none",
                                        isSelected
                                            ? "bg-primary/5 border-primary/20"
                                            : "bg-background border-transparent hover:bg-muted/50 hover:border-border"
                                    )}
                                >
                                    <div className={cn(
                                        "w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 border",
                                        isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                                    )}>
                                        {initials}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-bold truncate flex-1",
                                        isSelected ? "text-primary" : "text-foreground"
                                    )}>
                                        {item.name}
                                    </span>
                                    {isSelected && <Check className="h-3 w-3 text-primary shrink-0" />}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    // View: Default Form (Refactored for Top Manifest)
    if (inline) {
        return (
            <>
                {/* Staff Selection Field */}
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1">
                        Responsable
                    </label>
                    <button
                        onClick={() => { setOpenStaff(true); onSearchOpenChange?.(true); }}
                        className={cn(
                            "w-full flex items-center gap-3 h-10 px-4 rounded-md text-xs transition-all border shadow-none",
                            selectedStaff
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                        )}
                    >
                        <User className={cn("h-4 w-4 shrink-0", selectedStaff ? "text-primary-foreground" : "text-muted-foreground")} />
                        <span className={cn("flex-1 text-left truncate font-bold uppercase tracking-tight", selectedStaff ? "" : "opacity-60")}>
                            {selectedStaff ? selectedStaff.name : "Seleccionar Personal"}
                        </span>
                        <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-40 ml-auto" />
                    </button>
                </div>

                {/* Area Selection Field */}
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1">
                        Área Curricular
                    </label>
                    <button
                        onClick={() => { setOpenArea(true); onSearchOpenChange?.(true); }}
                        className={cn(
                            "w-full flex items-center gap-3 h-10 px-4 rounded-md text-xs transition-all border shadow-none",
                            curricularAreaId
                                ? "bg-foreground text-background border-foreground"
                                : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                        )}
                    >
                        <BookOpen className={cn("h-4 w-4 shrink-0", curricularAreaId ? "text-background" : "text-muted-foreground")} />
                        <span className={cn("flex-1 text-left truncate font-bold uppercase tracking-tight", curricularAreaId ? "" : "opacity-60")}>
                            {curricularAreaId ? (
                                curricularAreas?.find((area) => area.id === curricularAreaId)?.name
                            ) : (
                                "Seleccionar Área"
                            )}
                        </span>
                        <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-40 ml-auto" />
                    </button>
                </div>

                {/* Grade Selection Row */}
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Grado</label>
                    <div className="grid grid-cols-4 gap-1">
                        {grades?.map((grade) => (
                            <button
                                key={grade.id}
                                onClick={() => onGradeChange?.(grade.id)}
                                className={cn(
                                    "h-10 text-[10px] font-black rounded-md transition-all border uppercase shadow-none",
                                    gradeId === grade.id
                                        ? "bg-foreground text-background border-foreground"
                                        : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                                )}
                            >
                                {grade.name.replace('Grado', '').trim()}G
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section Selection Row */}
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Sección</label>
                    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                        {!gradeId ? (
                            <div className="flex-1 h-10 border border-dashed border-border rounded-md flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase opacity-40">
                                Bloqueado
                            </div>
                        ) : (
                            sections?.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => onSectionChange?.(section.id)}
                                    className={cn(
                                        "h-10 w-10 shrink-0 text-[10px] font-black rounded-md transition-all border uppercase shadow-none",
                                        sectionId === section.id
                                            ? "bg-foreground text-background border-foreground"
                                            : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                                    )}
                                >
                                    {section.name}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </>
        );
    }

    // View: Default Form
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Staff Section */}
            <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1">
                    Responsable
                </label>
                <button
                    onClick={() => { setOpenStaff(true); onSearchOpenChange?.(true); }}
                    className={cn(
                        "w-full flex items-center gap-3 h-12 px-4 rounded-md text-xs transition-all border",
                        selectedStaff
                            ? "bg-primary text-primary-foreground border-primary shadow-none"
                            : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                    )}
                >
                    <User className={cn("h-4 w-4 shrink-0", selectedStaff ? "text-primary-foreground" : "text-muted-foreground")} />
                    <span className={cn("flex-1 text-left truncate font-bold uppercase tracking-tight", selectedStaff ? "" : "opacity-60")}>
                        {selectedStaff ? selectedStaff.name : "Buscar personal..."}
                    </span>
                    <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" />
                </button>
            </div>

            {/* Curricular Area Section */}
            <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1">
                    Área
                </label>
                <button
                    onClick={() => { setOpenArea(true); onSearchOpenChange?.(true); }}
                    className={cn(
                        "w-full flex items-center gap-3 h-12 px-4 rounded-md text-xs transition-all border",
                        curricularAreaId
                            ? "bg-foreground text-background border-foreground shadow-none"
                            : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                    )}
                >
                    <BookOpen className={cn("h-4 w-4 shrink-0", curricularAreaId ? "text-background" : "text-muted-foreground")} />
                    <span className={cn("flex-1 text-left truncate font-bold uppercase tracking-tight", curricularAreaId ? "" : "opacity-60")}>
                        {curricularAreaId ? (
                            curricularAreas?.find((area) => area.id === curricularAreaId)?.name
                        ) : (
                            "Seleccionar Área..."
                        )}
                    </span>
                    <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" />
                </button>
            </div>

            {/* Academic Fields (Grades/Sections) */}
            <div className="space-y-6 pt-2">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Grado</label>
                    <div className="grid grid-cols-4 gap-2">
                        {grades?.map((grade) => (
                            <button
                                key={grade.id}
                                onClick={() => onGradeChange?.(grade.id)}
                                className={cn(
                                    "h-10 text-[11px] font-black rounded-md transition-all border uppercase",
                                    gradeId === grade.id
                                        ? "bg-primary text-primary-foreground border-primary shadow-none"
                                        : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                                )}
                            >
                                {grade.name.replace('Grado', '').trim()}G
                            </button>
                        ))}
                    </div>
                </div>

                {gradeId && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Sección</label>
                        <div className="flex flex-wrap gap-2">
                            {sections?.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => onSectionChange?.(section.id)}
                                    className={cn(
                                        "h-10 w-10 text-[11px] font-black rounded-md transition-all border uppercase",
                                        sectionId === section.id
                                            ? "bg-primary text-primary-foreground border-primary shadow-none"
                                            : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                                    )}
                                >
                                    {section.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
