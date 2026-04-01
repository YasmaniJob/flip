'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    useGrades,
    useCreateGrade,
    useBulkCreateGrades,
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
import { Plus, Trash2, Loader2, Check, Layers, ChevronRight } from 'lucide-react';
import { ActionConfirm } from '@/components/molecules/action-confirm';
import { Slider } from '@/components/ui/slider';
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
    const bulkCreateGradeMutation = useBulkCreateGrades();
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
    const [bulkCount, setBulkCount] = useState(1);

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

    const handleBulkAddGrades = async () => {
        const level = applicableLevels[0] || 'primaria';
        const levelGrades = grades.filter(g => g.level === level);
        const currentCount = levelGrades.length;
        
        const toCreate = Array.from({ length: bulkCount }).map((_, i) => ({
            name: `${currentCount + i + 1}° Grado`,
            level,
            sortOrder: currentCount + i,
        }));

        if (toCreate.length > 0) {
            await bulkCreateGradeMutation.mutateAsync(toCreate);
            setBulkCount(1);
        }
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

    const isPending = createGradeMutation.isPending || bulkCreateGradeMutation.isPending;

    return (
        <div className="space-y-8">
            {/* Quick Batch Configurator */}
            <div className="bg-muted/10 border border-border rounded-md p-8 shadow-none group">
                <div className="flex flex-col md:flex-row md:items-center gap-10">
                    {/* Visual Label */}
                    <div className="space-y-1 min-[200px]:">
                        <div className="flex items-center gap-2 text-primary">
                            <Layers className="h-4 w-4" />
                            <h3 className="text-sm font-black uppercase tracking-widest leading-none">Grados del Nivel</h3>
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none">
                            Creación de los grados académicos • <span className="text-primary/60">{applicableLevels[0]}</span>
                        </p>
                    </div>

                    {/* Slider Control */}
                    <div className="flex-1 space-y-4">
                       <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Seleccionar número de grados</span>
                            <div className="bg-primary/10 text-primary px-3 py-1 rounded-md border border-primary/20 text-xs font-black">
                                + {bulkCount} GRADOS
                            </div>
                       </div>
                       <div className="py-2">
                           <Slider
                                disabled={isPending}
                                defaultValue={[1]}
                                max={12}
                                min={1}
                                step={1}
                                value={[bulkCount]}
                                onValueChange={(v) => setBulkCount(v[0])}
                                className="cursor-pointer"
                           />
                       </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => handleAddSingleGrade(applicableLevels[0] || 'primaria')}
                            disabled={isPending}
                            className="h-12 px-6 rounded-md text-[10px] font-black uppercase tracking-widest border border-border shadow-none"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="jira"
                            onClick={handleBulkAddGrades}
                            disabled={isPending}
                            className="h-12 min-w-[220px] rounded-md text-[10px] font-black uppercase tracking-widest shadow-none flex items-center justify-center gap-3 transition-all"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <span>Crear {bulkCount} Grados</span>
                                    <ChevronRight className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Grades List (Jira Style Table) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">Grados</h2>
                    <span className="text-[10px] font-black text-muted-foreground/30 uppercase">{sortedGrades.length} GRADOS</span>
                </div>

                <div className="border border-border rounded-md bg-card overflow-hidden shadow-none">
                    <div className="divide-y divide-border/60">
                        {sortedGrades.length > 0 ? sortedGrades.map(grade => (
                            <div key={grade.id} className="group flex flex-col md:flex-row md:items-center gap-6 py-4 px-6 hover:bg-muted/10 transition-colors bg-background">
                                {/* Grade Info */}
                                <div className="flex items-center justify-between min-w-[220px]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 shrink-0 rounded-md flex items-center justify-center font-black bg-muted border border-border text-foreground text-xs shadow-none">
                                            {grade.name.split('°')[0]}
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className="text-sm font-black uppercase tracking-tight text-foreground">{grade.name}</h4>
                                            <span className="text-[10px] font-black text-muted-foreground uppercase opacity-40 tracking-widest">
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
                                        className="h-9 w-9 text-muted-foreground hover:text-rose-600 hover:bg-muted rounded-md transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-background border-none p-20 text-center flex flex-col items-center justify-center min-h-[300px]">
                                <Layers className="h-10 w-10 text-muted-foreground/10 mb-4" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground opacity-20 mb-1">Sin Grados Configurados</h3>
                                <p className="text-[10px] font-bold text-muted-foreground/30 max-w-xs mx-auto uppercase tracking-widest">Usa la configuración de grados de arriba para comenzar.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Dialogs */}
            <ActionConfirm
                open={!!deletingGrade}
                onOpenChange={(open) => { !open && setDeletingGrade(null); setDeleteError(null); }}
                title="¿Confirmar eliminación de grado?"
                description={`Estás por eliminar el "${deletingGrade?.name}" del catálogo institucional. Asegúrate de que no existian secciones vinculadas para proceder con la baja técnica.`}
                onConfirm={handleDeleteGrade}
                confirmText="Confirmar eliminación"
                variant="destructive"
                isLoading={deleteGradeMutation.isPending}
                error={deleteError || undefined}
            />

            <ActionConfirm
                open={!!deletingSection}
                onOpenChange={(open) => !open && setDeletingSection(null)}
                title="¿Confirmar eliminación de sección?"
                description={`Estás por dar de baja la sección "${deletingSection?.name}" del registro académico institutional. Esta acción no se puede deshacer.`}
                onConfirm={handleDeleteSection}
                confirmText="Confirmar eliminación"
                variant="destructive"
                isLoading={deleteSectionMutation.isPending}
            />
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
    return (
        <div className="flex-1 flex flex-wrap items-center gap-2 overflow-hidden">
            {sections.map(section => (
                <div
                    key={section.id}
                    className="relative group/section flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-muted border border-border rounded-md text-[11px] font-black text-foreground hover:bg-muted/80 transition-all uppercase tracking-widest shadow-none"
                >
                    <span className="tracking-tight">{section.name}</span>
                    <button
                        onClick={() => onDeleteSection(section)}
                        className="w-4 h-4 flex items-center justify-center rounded-sm hover:bg-rose-50 text-rose-600 transition-colors opacity-0 group-hover/section:opacity-100"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            ))}

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
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-dashed border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all h-[32px] shadow-none"
                >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    SECCIÓN
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 overflow-hidden bg-background border border-border rounded-md shadow-none">
                <DialogHeader className="p-8 border-b border-border bg-muted/10">
                    <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                        <Layers className="h-5 w-5 text-primary" />
                        Masivo: Secciones
                    </DialogTitle>
                    <DialogDescription className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Crear secciones para <span className="text-foreground">{grade.name}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8">
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
                                        "h-12 flex items-center justify-center rounded-md text-sm font-black transition-all border outline-none shadow-none relative",
                                        isExisting && "bg-muted/40 border-border/50 text-muted-foreground/40 cursor-not-allowed",
                                        isSelected && "bg-primary border-primary text-white",
                                        !isExisting && !isSelected && "bg-background border-border hover:border-primary/20 hover:bg-primary/5 text-foreground"
                                    )}
                                >
                                    {letter}
                                    {isExisting && <Check className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 text-white rounded-full p-0.5 border border-background" />}
                                </button>
                            );
                        })}
                    </div>

                    <DialogFooter className="flex items-center gap-3 w-full">
                        <Button
                            variant="ghost"
                            onClick={() => { setOpen(false); setSelectedLetter(null); }}
                            className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest rounded-md"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="jira"
                            disabled={!selectedLetter || isPending}
                            onClick={handleConfirm}
                            className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest rounded-md"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                            Configurar
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
