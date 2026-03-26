'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    useGrades,
    useCreateGrade,
    useDeleteGrade,
    type Grade,
} from '@/features/settings/hooks/use-grades';
import {
    useSections,
    useCreateSection,
    useBulkCreateSections,
    useDeleteSection,
    type Section,
} from '@/features/settings/hooks/use-sections';
import { Plus, Trash2, Loader2, Check, AlertCircle, Layers } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

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
    const bulkCreateSectionMutation = useBulkCreateSections();
    const deleteSectionMutation = useDeleteSection();

    const applicableLevels: EducationLevel[] = useMemo(() => {
        if (!educationLevel) return ['primaria', 'secundaria'];
        const normalized = educationLevel.toLowerCase();
        const levels: EducationLevel[] = [];
        if (normalized.includes('primaria')) levels.push('primaria');
        if (normalized.includes('secundaria')) levels.push('secundaria');
        return levels.length > 0 ? levels : ['primaria', 'secundaria'];
    }, [educationLevel]);

    const [deletingGrade, setDeletingGrade] = useState<Grade | null>(null);
    const [deletingSection, setDeletingSection] = useState<Section | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const getSectionsForGrade = (gradeId: string) => sections.filter(s => s.gradeId === gradeId);

    const handleAddSingleGrade = async (level: EducationLevel) => {
        const levelGrades = grades.filter(g => g.level === level);
        const nextOrder = levelGrades.length;
        const nextName = `${levelGrades.length + 1}° Grado`;

        await createGradeMutation.mutateAsync({
            name: nextName,
            level,
            sortOrder: nextOrder,
        });
    };

    const handleBulkAddSectionNames = async (grade: Grade, names: string[]) => {
        const toCreate = names.map(name => ({
            name,
            gradeId: grade.id
        }));

        if (toCreate.length > 0) {
            await bulkCreateSectionMutation.mutateAsync({ sections: toCreate });
        }
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

    const sortedGrades = [...grades].sort((a, b) => {
        if (a.level !== b.level) return a.level === 'primaria' ? -1 : 1;
        return a.sortOrder - b.sortOrder;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold sr-only">Grados y Secciones</h2>
            </div>

            {/* Grades List (Jira Style Table) */}
            <div className="border border-border rounded-lg bg-card shadow-sm overflow-hidden">
                <div className="divide-y divide-border/60">
                    {sortedGrades.map(grade => (
                        <div key={grade.id} className="group flex flex-col md:flex-row md:items-center gap-6 py-4 px-6 hover:bg-muted/20 transition-colors bg-white">
                            {/* Grade Info */}
                            <div className="flex items-center justify-between min-w-[180px]">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 shrink-0 rounded-md flex items-center justify-center font-black bg-primary/10 text-primary border border-primary/20 text-xs">
                                        {grade.name.split(' ')[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="text-[13px] font-black uppercase tracking-tight text-foreground">{grade.name}</h4>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                                            {grade.level}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Sections Management */}
                            <div className="flex-1 overflow-hidden">
                                <GradeSectionsList 
                                    grade={grade} 
                                    sections={getSectionsForGrade(grade.id)}
                                    onDeleteSection={(s) => setDeletingSection(s)}
                                    onAddBulk={(names) => handleBulkAddSectionNames(grade, names)}
                                    isPending={createSectionMutation.isPending || bulkCreateSectionMutation.isPending}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeletingGrade(grade)}
                                    className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    
                    {/* Add Grade Control */}
                    <div className="p-4 bg-muted/10 border-t border-border/50">
                        <GradesPopover 
                            level={applicableLevels[0] || 'primaria'}
                            onAddOne={() => handleAddSingleGrade(applicableLevels[0] || 'primaria')}
                            onAddBulk={(count: number) => {
                                for(let i=0; i<count; i++) handleAddSingleGrade(applicableLevels[0] || 'primaria');
                            }}
                            isPending={createGradeMutation.isPending}
                        />
                    </div>
                </div>
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
                    </AlertDialogHeader>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function GradeSectionsList({ 
    grade, 
    sections, 
    onDeleteSection, 
    onAddBulk, 
    isPending 
}: { 
    grade: Grade; 
    sections: Section[]; 
    onDeleteSection: (s: Section) => void;
    onAddBulk: (names: string[]) => void;
    isPending: boolean;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const limit = 7;
    const hasMore = sections.length > limit;
    const displayedSections = isExpanded ? sections : sections.slice(0, limit);

    return (
        <div className="flex-1 flex flex-wrap items-center gap-1.5 overflow-hidden">
            {displayedSections.map(section => (
                <div
                    key={section.id}
                    className="relative group/section flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-[#ebf2ff] border border-transparent rounded-md text-[13px] font-black text-[#0052cc] hover:bg-[#deebff] transition-all shadow-none"
                >
                    <span className="tracking-tight">{section.name}</span>
                    <button
                        onClick={() => onDeleteSection(section)}
                        className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-rose-50 text-rose-600 transition-colors opacity-0 group-hover/section:opacity-100"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            ))}

            {hasMore && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-3 py-1.5 bg-muted/40 hover:bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground rounded-md transition-colors border border-border/50 h-[33px]"
                >
                    {isExpanded ? 'Contraer' : `+ ${sections.length - limit} más`}
                </button>
            )}

            <BatchSectionsModal 
                grade={grade}
                existingSections={sections}
                onConfirm={onAddBulk}
                isPending={isPending}
            />
        </div>
    );
}

function BatchSectionsModal({ 
    grade, 
    existingSections, 
    onConfirm, 
    isPending 
}: { 
    grade: Grade; 
    existingSections: Section[];
    onConfirm: (names: string[]) => void;
    isPending: boolean;
}) {
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const existingNames = existingSections.map(s => s.name.toUpperCase());

    const selectedNames = useMemo(() => {
        if (!selectedLetter) return [];
        const index = alphabet.indexOf(selectedLetter);
        return alphabet.slice(0, index + 1).filter(l => !existingNames.includes(l));
    }, [selectedLetter, existingNames]);

    const handleConfirm = () => {
        onConfirm(selectedNames);
        setOpen(false);
        setSelectedLetter(null);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    disabled={isPending}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-dashed border-border/80 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all h-[33px]"
                >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    SECCIÓN
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-6 bg-card border-border shadow-2xl rounded-xl">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                        <Layers className="h-5 w-5 text-primary" />
                        Agregar Varias Secciones
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        Selecciona hasta qué letra deseas crear para el grado <span className="font-bold text-foreground">{grade.name}</span>. Las existentes ya están marcadas.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-6 gap-2 mb-8">
                    {alphabet.map(letter => {
                        const isExisting = existingNames.includes(letter);
                        const isSelected = selectedLetter && alphabet.indexOf(letter) <= alphabet.indexOf(selectedLetter) && !isExisting;
                        
                        return (
                            <button
                                key={letter}
                                disabled={isExisting}
                                onClick={() => setSelectedLetter(letter)}
                                className={cn(
                                    "h-12 flex items-center justify-center rounded-lg text-sm font-black transition-all border outline-none",
                                    isExisting && "bg-muted/40 border-border/50 text-muted-foreground/40 cursor-not-allowed",
                                    isSelected && "bg-primary border-primary text-white scale-105 shadow-md shadow-primary/20",
                                    !isExisting && !isSelected && "bg-card border-border hover:border-primary/40 hover:bg-primary/5 text-foreground"
                                )}
                            >
                                {letter}
                                {isExisting && <Check className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 text-white rounded-full p-0.5 border border-card" />}
                            </button>
                        );
                    })}
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => { setOpen(false); setSelectedLetter(null); }}
                        className="text-[11px] font-black uppercase tracking-widest rounded-md"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="jira"
                        disabled={!selectedLetter || isPending}
                        onClick={handleConfirm}
                        className="flex-1 h-11 text-[11px] font-black uppercase tracking-widest rounded-md"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        {selectedNames.length > 0 ? `Crear ${selectedNames.length} Secciones` : 'Selecciona una letra'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function GradesPopover({ level, onAddOne, onAddBulk, isPending }: { 
    level: string; 
    onAddOne: () => void; 
    onAddBulk: (count: number) => void;
    isPending: boolean;
}) {
    const [count, setCount] = useState(1);
    const [open, setOpen] = useState(false);

    const handleBulk = () => {
        onAddBulk(count);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    disabled={isPending}
                    variant="outline"
                    className="w-full h-10 border-dashed border-border/80 hover:border-primary hover:text-primary hover:bg-primary/5 rounded-md font-black uppercase tracking-widest text-[11px] shadow-none"
                >
                    {isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Plus className="h-4 w-4 mr-2" />
                    )}
                    Agregar Nuevo Grado
                </Button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-64 p-4 space-y-4 shadow-xl border-border bg-card">
                <div className="space-y-1.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Añadir Grados</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        Nivel: <span className="text-primary">{level}</span>
                    </p>
                </div>

                <div className="space-y-4">
                    <Button 
                        variant="jiraOutline" 
                        size="sm" 
                        className="w-full justify-start h-9 rounded-md border-border/60" 
                        onClick={() => { onAddOne(); setOpen(false); }}
                    >
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        Añadir 1 (Sig. Nivel)
                    </Button>

                    <div className="pt-2 border-t border-border/50 space-y-3">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/70">
                                Cantidad a generar
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="number" 
                                    min={1} 
                                    max={12} 
                                    value={count} 
                                    onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                                    className="h-8 text-xs font-bold rounded-md bg-muted/20"
                                />
                                <span className="text-[10px] font-bold text-muted-foreground shrink-0 uppercase">grados</span>
                            </div>
                        </div>
                        <Button 
                            variant="jira" 
                            size="sm" 
                            className="w-full h-8 rounded-md text-[10px]" 
                            onClick={handleBulk}
                        >
                            <Layers className="h-3 w-3 mr-2" />
                            Generar {count} grados
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
