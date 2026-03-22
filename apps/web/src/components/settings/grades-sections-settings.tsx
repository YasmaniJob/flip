'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
    useGrades,
    useCreateGrade,
    useDeleteGrade,
    type Grade,
} from '@/features/settings/hooks/use-grades';
import {
    useSections,
    useCreateSection,
    useDeleteSection,
    type Section,
} from '@/features/settings/hooks/use-sections';
import { Plus, Trash2, Loader2, GraduationCap, ChevronDown, ChevronRight, Check, AlertCircle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type EducationLevel = 'primaria' | 'secundaria';

interface GradesSectionsSettingsProps {
    educationLevel?: string;
}

export function GradesSectionsSettings({ educationLevel }: GradesSectionsSettingsProps) {
    const { data: grades = [], isLoading: loadingGrades } = useGrades();
    const { data: sections = [], isLoading: loadingSections } = useSections();

    const createGradeMutation = useCreateGrade();
    const deleteGradeMutation = useDeleteGrade();
    const createSectionMutation = useCreateSection();
    const deleteSectionMutation = useDeleteSection();

    const applicableLevels: EducationLevel[] = useMemo(() => {
        if (!educationLevel) return ['primaria', 'secundaria'];
        const normalized = educationLevel.toLowerCase();
        const levels: EducationLevel[] = [];
        if (normalized.includes('primaria')) levels.push('primaria');
        if (normalized.includes('secundaria')) levels.push('secundaria');
        return levels.length > 0 ? levels : ['primaria', 'secundaria'];
    }, [educationLevel]);

    const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({
        primaria: true,
        secundaria: true
    });

    const toggleLevel = (level: EducationLevel) => {
        setExpandedLevels(prev => ({ ...prev, [level]: !prev[level] }));
    };

    // Sliders state
    const [primariaCount, setPrimariaCount] = useState(6);
    const [secundariaCount, setSecundariaCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});

    const [deletingGrade, setDeletingGrade] = useState<Grade | null>(null);
    const [deletingSection, setDeletingSection] = useState<Section | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const getSectionsForGrade = (gradeId: string) => sections.filter(s => s.gradeId === gradeId);

    const generateGrades = async (level: EducationLevel, count: number) => {
        setIsGenerating(prev => ({ ...prev, [level]: true }));
        try {
            for (let i = 0; i < count; i++) {
                await createGradeMutation.mutateAsync({
                    name: `${i + 1}° Grado`,
                    level,
                    sortOrder: i,
                });
            }
        } finally {
            setIsGenerating(prev => ({ ...prev, [level]: false }));
        }
    };

    const handleAddSingleGrade = async (level: EducationLevel) => {
        const levelGrades = grades.filter(g => g.level === level);
        const nextOrder = levelGrades.length;
        // Try to find the next number. ex: if "5° Grado" exists, create "6° Grado"
        const nextName = `${levelGrades.length + 1}° Grado`;

        await createGradeMutation.mutateAsync({
            name: nextName,
            level,
            sortOrder: nextOrder,
        });
    };

    const handleAddSection = async (grade: Grade) => {
        const gradeSections = getSectionsForGrade(grade.id);
        // Generate next letter: A, B, C...
        const existingNames = gradeSections.map(s => s.name.toUpperCase());
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let nextLetter = 'A';

        for (const letter of alphabet) {
            if (!existingNames.includes(letter)) {
                nextLetter = letter;
                break;
            }
        }

        await createSectionMutation.mutateAsync({
            name: nextLetter,
            gradeId: grade.id,
        });
    };

    const handleDeleteGrade = async () => {
        if (!deletingGrade) return;
        try {
            setDeleteError(null);
            await deleteGradeMutation.mutateAsync(deletingGrade.id);
            setDeletingGrade(null);
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Error al eliminar');
        }
    };

    const handleDeleteSection = async () => {
        if (!deletingSection) return;
        await deleteSectionMutation.mutateAsync(deletingSection.id);
        setDeletingSection(null);
    };

    if (loadingGrades || loadingSections) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const primariaGrades = grades.filter(g => g.level === 'primaria').sort((a, b) => a.sortOrder - b.sortOrder);
    const secundariaGrades = grades.filter(g => g.level === 'secundaria').sort((a, b) => a.sortOrder - b.sortOrder);

    const renderLevelConfig = (level: EducationLevel, levelGrades: Grade[]) => {
        const isExpanded = expandedLevels[level];
        const levelLabel = level === 'primaria' ? 'Primaria' : 'Secundaria';
        const sliderValue = level === 'primaria' ? primariaCount : secundariaCount;
        const setSliderValue = level === 'primaria' ? setPrimariaCount : setSecundariaCount;
        const isLevelGenerating = isGenerating[level];

        return (
            <div key={level} className={`border border-border rounded-lg overflow-hidden bg-card/20 mb-6 shadow-none transition-all`}>
                {/* Level Header */}
                <button
                    onClick={() => toggleLevel(level)}
                    className={cn(
                        "w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors border-b border-border/50",
                        !isExpanded && "border-b-0"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-white border border-border shadow-none text-primary">
                            <GraduationCap className="h-4 w-4" />
                        </div>
                        <span className="font-black text-sm uppercase tracking-tight text-foreground">{levelLabel}</span>
                        {levelGrades.length > 0 && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                {levelGrades.length} {levelGrades.length === 1 ? 'GRADO' : 'GRADOS'}
                            </span>
                        )}
                    </div>
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>

                {/* Content */}
                {isExpanded && (
                    <div className="p-0">
                        {levelGrades.length === 0 ? (
                            // Empty State with Slider
                            <div className="max-w-xs mx-auto py-12 space-y-8">
                                <div className="text-center space-y-1.5">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Configuración Rápida</h3>
                                    <p className="text-[11px] text-muted-foreground">
                                        Define el total de grados para el nivel {levelLabel}
                                    </p>
                                </div>

                                <div className="space-y-10">
                                    <div className="text-center">
                                        <span className="text-5xl font-black text-primary tracking-tighter">{sliderValue}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">grados</span>
                                    </div>

                                    <div className="space-y-6">
                                        <Slider
                                            value={[sliderValue]}
                                            onValueChange={(val) => setSliderValue(val[0])}
                                            min={1}
                                            max={12}
                                            step={1}
                                            className="py-1"
                                        />
                                        <div className="flex justify-between text-[10px] text-muted-foreground font-black uppercase tracking-widest px-1">
                                            <span>Mín: 1</span>
                                            <span>Máx: 12</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => generateGrades(level, sliderValue)}
                                    disabled={isLevelGenerating}
                                    className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-md font-black uppercase tracking-widest text-[11px] shadow-none transition-all active:scale-95"
                                >
                                    {isLevelGenerating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Generando...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Generar {sliderValue} Grados
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            // List View
                            <>
                                <div className="divide-y divide-border/50">
                                    {levelGrades.map(grade => (
                                        <div key={grade.id} className="group flex flex-col md:flex-row md:items-center gap-4 py-4 px-6 hover:bg-muted/20 transition-colors">
                                            {/* Grade Name & Delete */}
                                            <div className="flex items-center justify-between min-w-[200px]">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-9 h-9 rounded-md flex items-center justify-center font-black bg-primary/10 text-primary border border-primary/20 text-xs">
                                                        {grade.name.split(' ')[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-black uppercase tracking-widest text-foreground">{grade.name}</h4>
                                                        <p className="text-[10px] font-bold text-muted-foreground hidden md:block mt-0.5">
                                                            {getSectionsForGrade(grade.id).length} SECCIONES
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeletingGrade(grade)}
                                                    className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-all rounded-md"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>

                                            {/* Sections List */}
                                            <div className="flex-1 flex flex-wrap items-center gap-1.5">
                                                {getSectionsForGrade(grade.id).map(section => (
                                                    <div
                                                        key={section.id}
                                                        className="relative group/section flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-card border border-border rounded-md text-[13px] font-bold text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all shadow-none"
                                                    >
                                                        <span className="tracking-tight">{section.name}</span>
                                                        <button
                                                            onClick={() => setDeletingSection(section)}
                                                            className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-rose-50 text-muted-foreground hover:text-rose-600 transition-colors opacity-0 group-hover/section:opacity-100"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* Add Section Button */}
                                                <button
                                                    onClick={() => handleAddSection(grade)}
                                                    disabled={createSectionMutation.isPending}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-dashed border-border/80 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
                                                >
                                                    {createSectionMutation.isPending ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Plus className="h-3 w-3" />
                                                    )}
                                                    SECCIÓN
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Grade Button */}
                                <div className="p-4 bg-muted/20">
                                    <Button
                                        onClick={() => handleAddSingleGrade(level)}
                                        disabled={createGradeMutation.isPending}
                                        variant="outline"
                                        className="w-full h-10 border-dashed border-border/80 hover:border-primary hover:text-primary hover:bg-primary/5 rounded-md font-black uppercase tracking-widest text-[11px] shadow-none"
                                    >
                                        {createGradeMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Plus className="h-4 w-4 mr-2" />
                                        )}
                                        Agregar Nuevo Grado
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold sr-only">Grados y Secciones</h2>
            </div>

            {/* Levels */}
            <div className="space-y-6">
                {applicableLevels.includes('primaria') && renderLevelConfig('primaria', primariaGrades)}
                {applicableLevels.includes('secundaria') && renderLevelConfig('secundaria', secundariaGrades)}
            </div>

            {/* Delete Grade Confirmation */}
            <AlertDialog open={!!deletingGrade} onOpenChange={() => { setDeletingGrade(null); setDeleteError(null); }}>
                <AlertDialogContent className="shadow-none border border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">¿Eliminar Grado?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            El grado <span className="font-bold text-foreground">"{deletingGrade?.name}"</span> será eliminado permanentemente. Asegúrate de que no tenga secciones asociadas para proceder.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && (
                        <div className="flex items-center gap-3 p-3 rounded-md bg-rose-50 border border-rose-100 text-rose-700 text-[13px] font-bold">
                            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                            <span>{deleteError}</span>
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-md h-10 text-xs font-black uppercase tracking-widest border-border shadow-none">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteGrade} className="bg-rose-600 hover:bg-rose-700 text-white rounded-md h-10 text-xs font-black uppercase tracking-widest shadow-none">
                            {deleteGradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar Registro'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Section Confirmation */}
            <AlertDialog open={!!deletingSection} onOpenChange={() => setDeletingSection(null)}>
                <AlertDialogContent className="shadow-none border border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">¿Eliminar Sección?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            La sección <span className="font-bold text-foreground">"{deletingSection?.name}"</span> será eliminada permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-md h-10 text-xs font-black uppercase tracking-widest border-border shadow-none">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSection} className="bg-rose-600 hover:bg-rose-700 text-white rounded-md h-10 text-xs font-black uppercase tracking-widest shadow-none">
                            {deleteSectionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
