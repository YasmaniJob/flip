'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
    useCurricularAreas,
    useCreateCurricularArea,
    useUpdateCurricularArea,
    useDeleteCurricularArea,
    type CurricularArea,
} from '@/features/settings/hooks/use-curricular-areas';
import { Plus, Trash2, Loader2, BookOpen, Sparkles, AlertCircle, Pencil } from 'lucide-react';
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
import { SimpleFormModal } from '@/components/molecules/wizard-modal';
import { ImportCurricularAreasDialog } from './import-curricular-areas-dialog';

interface CurricularAreasSettingsProps {
    educationLevel?: string;
}

export function CurricularAreasSettings({ educationLevel }: CurricularAreasSettingsProps) {
    const { data: areas = [], isLoading, isError, refetch } = useCurricularAreas();
    const createMutation = useCreateCurricularArea();
    const updateMutation = useUpdateCurricularArea();
    const deleteMutation = useDeleteCurricularArea();

    const applicableLevels = useMemo(() => {
        if (!educationLevel) return ['primaria', 'secundaria'];
        const normalized = educationLevel.toLowerCase();
        const levels: ('primaria' | 'secundaria')[] = [];
        if (normalized.includes('primaria')) levels.push('primaria');
        if (normalized.includes('secundaria')) levels.push('secundaria');
        return levels.length > 0 ? levels : ['primaria', 'secundaria'];
    }, [educationLevel]);

    const [showModal, setShowModal] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [editingArea, setEditingArea] = useState<CurricularArea | null>(null);
    const [deletingArea, setDeletingArea] = useState<CurricularArea | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        levels: {
            primaria: applicableLevels.includes('primaria'),
            secundaria: applicableLevels.includes('secundaria')
        },
    });

    // Update form defaults when applicableLevels change
    useEffect(() => {
        if (!editingArea) {
            setFormData(prev => ({
                ...prev,
                levels: {
                    primaria: applicableLevels.includes('primaria'),
                    secundaria: applicableLevels.includes('secundaria')
                }
            }));
        }
    }, [applicableLevels, editingArea]);

    const handleSave = async () => {
        if (editingArea) {
            // Edit mode
            await updateMutation.mutateAsync({
                id: editingArea.id,
                name: formData.name,
            });
        } else {
            // Create mode
            const levels: ('primaria' | 'secundaria')[] = [];
            if (applicableLevels.includes('primaria')) levels.push('primaria');
            if (applicableLevels.includes('secundaria')) levels.push('secundaria');

            await createMutation.mutateAsync({
                name: formData.name,
                levels,
            });
        }
        setShowModal(false);
        setEditingArea(null);
        setFormData({ name: '', levels: { primaria: true, secundaria: true } });
    };

    const handleDelete = async () => {
        if (deletingArea) {
            await deleteMutation.mutateAsync(deletingArea.id);
            setDeletingArea(null);
        }
    };

    const openCreate = () => {
        setEditingArea(null);
        setFormData({
            name: '',
            levels: {
                primaria: applicableLevels.includes('primaria'),
                secundaria: applicableLevels.includes('secundaria')
            }
        });
        setShowModal(true);
    };

    const openEdit = (area: CurricularArea) => {
        setEditingArea(area);
        setFormData({
            name: area.name,
            levels: {
                primaria: area.levels?.includes('primaria') || false,
                secundaria: area.levels?.includes('secundaria') || false
            }
        });
        setShowModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-rose-50/20 border border-rose-200 rounded-lg p-6 text-center shadow-none">
                <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" />
                <p className="text-rose-900 font-bold text-sm uppercase tracking-tight">Error al cargar áreas</p>
                <Button 
                    variant="outline" 
                    onClick={() => refetch()} 
                    className="mt-4 rounded-md border-border shadow-none font-black uppercase tracking-widest text-[11px] h-9"
                >
                    Reintentar
                </Button>
            </div>
        );
    }

    // Filter areas based on level selection (frontend filter)
    const displayedAreas = areas.filter(area => area.levels?.some(l => applicableLevels.includes(l)));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={() => setShowImportDialog(true)}
                    className="bg-card hover:bg-muted/50 text-foreground border-border rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-9"
                >
                    <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
                    Importar Áreas
                </Button>
                <Button
                    onClick={openCreate}
                    className="bg-primary hover:bg-primary/90 text-white rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-9"
                >
                    <Plus className="h-3.5 w-3.5 mr-2" />
                    Nueva Área
                </Button>
            </div>

            {/* Areas List */}
            {displayedAreas.length === 0 ? (
                <div className="bg-card/30 border border-dashed border-border/80 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="max-w-xs space-y-2">
                        <h3 className="font-black text-sm uppercase tracking-tight text-foreground">Sin áreas curriculares</h3>
                        <p className="text-[11px] text-muted-foreground font-medium mb-6">
                            Importa las áreas del CNEB o crea tus propias áreas personalizadas para comenzar.
                        </p>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowImportDialog(true)}
                            className="bg-card border-border text-foreground hover:bg-muted/50 rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-10 px-6"
                        >
                            <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
                            Importar CNEB
                        </Button>
                        <Button
                            onClick={openCreate}
                            className="bg-primary hover:bg-primary/90 text-white rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-10 px-6"
                        >
                            <Plus className="h-3.5 w-3.5 mr-2" />
                            Crear personalizada
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {displayedAreas.map((area) => (
                        <div
                            key={area.id}
                            className="bg-card/40 border border-border rounded-lg p-4 hover:border-primary/40 hover:bg-card/60 transition-all group flex flex-col shadow-none relative"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-md bg-card border border-border flex items-center justify-center text-primary shadow-none">
                                        <BookOpen className="h-4 w-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-black text-[13px] uppercase tracking-tight text-foreground line-clamp-1" title={area.name}>
                                            {area.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {area.isStandard && (
                                                <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                                                    Estándar
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEdit(area)}
                                        className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeletingArea(area)}
                                        className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-md"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <SimpleFormModal
                open={showModal}
                onOpenChange={setShowModal}
                icon="📖"
                title={editingArea ? 'Editar Área Curricular' : 'Nueva Área Curricular'}
                description={editingArea
                    ? 'Modifica el nombre del área curricular.'
                    : 'Crea una nueva área curricular personalizada.'}
                formTitle="Detalles del Área"
                onSubmit={handleSave}
                onCancel={() => setShowModal(false)}
                submitLabel={editingArea ? 'Guardar Cambios' : 'Crear Registro'}
                canSubmit={formData.name.trim().length > 0 && !(createMutation.isPending || updateMutation.isPending)}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                sidebarChildren={
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/60 mb-4">Vista Previa</p>
                            <div className="w-full aspect-square rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 shadow-none">
                                <BookOpen className="h-16 w-16 text-white" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-white font-black text-sm uppercase tracking-tight truncate">
                                {formData.name || 'Nueva Área'}
                            </p>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                                {editingArea ? 'Editando Área' : 'Nuevo Registro'}
                            </p>
                        </div>
                    </div>
                }
            >
                <div className="space-y-6 pt-2">
                    <div className="space-y-3">
                        <Label htmlFor="area-name" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                            Nombre del Área <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="area-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Logística Digital o Arte Dramático"
                            className="h-11 text-sm rounded-md border-border focus:ring-1 focus:ring-primary shadow-none font-bold"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && formData.name.trim().length > 0) {
                                    handleSave();
                                }
                            }}
                        />
                        <p className="text-[11px] font-medium text-muted-foreground">
                            El nombre oficial que aparecerá en las libretas y certificados.
                        </p>
                    </div>
                </div>
            </SimpleFormModal>

            {/* Import Dialog */}
            <ImportCurricularAreasDialog
                open={showImportDialog}
                onOpenChange={setShowImportDialog}
                existingAreas={areas}
                onSuccess={() => {
                    refetch();
                }}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingArea} onOpenChange={() => setDeletingArea(null)}>
                <AlertDialogContent className="shadow-none border border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">¿Eliminar Área?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            El área <span className="font-bold text-foreground">"{deletingArea?.name}"</span> será eliminada permanentemente.
                            {deletingArea?.isStandard && (
                                <span className="block mt-2 text-[11px] font-medium text-muted-foreground leading-relaxed">
                                    Nota: Al ser un área estándar del CNEB, podrás volver a importarla en cualquier momento si es necesario.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-md h-10 text-xs font-black uppercase tracking-widest border-border shadow-none">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-md h-10 text-xs font-black uppercase tracking-widest shadow-none"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar Registro'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
