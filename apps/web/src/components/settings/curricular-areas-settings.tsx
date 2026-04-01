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
import { Plus, Trash2, Loader2, BookOpen, Sparkles, AlertCircle, Pencil, X, Check } from 'lucide-react';
import { ActionConfirm } from '@/components/molecules/action-confirm';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
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

    const displayedAreas = useMemo(() => {
        if (areas.length === 0) return [];
        return areas.filter(area => area.levels?.some(l => applicableLevels.includes(l as any)));
    }, [areas, applicableLevels]);

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

            {/* Create/Edit Modal - Jira Single Column Style */}
            <Dialog open={showModal} onOpenChange={(val) => {
                if (!val) {
                    setShowModal(false);
                    setEditingArea(null);
                }
            }}>
                {/* We use DialogContent with no shadow-none and border-border */}
                <DialogContent showCloseButton={false} className="max-w-xl p-0 flex flex-col overflow-hidden border border-border shadow-none rounded-sm bg-background">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{editingArea ? 'Editar Área Curricular' : 'Nueva Área Curricular'}</DialogTitle>
                    </DialogHeader>

                    {/* ── Header ────────────────────────────────────────────────────────── */}
                    <div className="shrink-0 px-6 py-5 border-b border-border bg-card/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-sm bg-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/10">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-foreground tracking-tight uppercase">
                                    {editingArea ? 'Editar Área' : 'Nueva Área Curricular'}
                                </h3>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                                    {editingArea ? 'Modifica los detalles del registro' : 'Configura un área personalizada'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => { setShowModal(false); setEditingArea(null); }}
                            className="p-2 rounded-sm hover:bg-muted text-muted-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* ── Content ───────────────────────────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
                        {/* Area Name Field */}
                        <div className="space-y-3">
                            <Label htmlFor="area-name" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                                Nombre Oficial del Área <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="area-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Logística Digital o Arte Dramático"
                                className="h-11 text-sm rounded-sm border-border focus:ring-4 focus:ring-primary/5 focus:border-primary/50 bg-background shadow-none font-bold placeholder:text-muted-foreground/30 transition-all"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && formData.name.trim().length > 0) {
                                        handleSave();
                                    }
                                }}
                            />
                            <p className="text-[11px] font-medium text-muted-foreground/70">
                                Este nombre aparecerá en los reportes académicos y libretas escolares.
                            </p>
                        </div>

                        {/* Level Selection Field */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                                Niveles Académicos Aplicables
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                                {['primaria', 'secundaria'].map((level) => {
                                    const isAvailable = applicableLevels.includes(level);
                                    const isSelected = formData.levels[level as keyof typeof formData.levels];
                                    
                                    if (!isAvailable && !editingArea) return null;

                                    return (
                                        <div 
                                            key={level}
                                            onClick={() => setFormData({
                                                ...formData,
                                                levels: {
                                                    ...formData.levels,
                                                    [level]: !isSelected
                                                }
                                            })}
                                            className={cn(
                                                "group flex items-center justify-between p-4 rounded-sm border transition-all cursor-pointer bg-card/10 select-none",
                                                isSelected 
                                                    ? "border-primary bg-primary/5" 
                                                    : "border-border hover:border-primary/30 hover:bg-muted/10",
                                                !isAvailable && "opacity-50 cursor-not-allowed border-dashed bg-muted/5"
                                            )}
                                        >
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                isSelected ? "text-primary" : "text-muted-foreground"
                                            )}>
                                                {level}
                                            </span>
                                            
                                            <div className={cn(
                                                "w-5 h-5 rounded-sm border transition-all flex items-center justify-center",
                                                isSelected 
                                                    ? "bg-primary border-primary" 
                                                    : "border-border/60 group-hover:border-primary/50"
                                            )}>
                                                {isSelected && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── Footer ────────────────────────────────────────────────────────── */}
                    <div className="shrink-0 p-5 border-t border-border bg-muted/10 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => { setShowModal(false); setEditingArea(null); }}
                            className="text-[11px] font-black uppercase tracking-widest h-10 px-6 rounded-sm hover:bg-muted text-muted-foreground"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={formData.name.trim().length === 0 || (createMutation.isPending || updateMutation.isPending)}
                            className="h-10 px-8 rounded-sm font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all shadow-none flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            {createMutation.isPending || updateMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Check className="h-3.5 w-3.5" />
                            )}
                            {editingArea ? 'Guardar Cambios' : 'Crear Registro'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Import Dialog */}
            <ImportCurricularAreasDialog
                open={showImportDialog}
                onOpenChange={setShowImportDialog}
                existingAreas={areas}
                educationLevel={educationLevel}
                onSuccess={() => {
                    refetch();
                }}
            />

            {/* Delete Confirmation: Institutional Action Box */}
            <ActionConfirm
                open={!!deletingArea}
                onOpenChange={(open) => !open && setDeletingArea(null)}
                title="¿Confirmar eliminación de área curricular?"
                description={`Estás por eliminar permanentemente el área "${deletingArea?.name}" del catálogo institucional. Esta acción afectará los reportes académicos asociados a este registro.`}
                onConfirm={handleDelete}
                confirmText="Confirmar eliminación"
                variant="destructive"
                isLoading={deleteMutation.isPending}
            />
        </div >
    );
}
