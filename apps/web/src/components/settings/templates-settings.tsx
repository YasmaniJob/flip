'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    useTemplates,
    useCreateTemplate,
    useUpdateTemplate,
    useDeleteTemplate,
    type ResourceTemplate,
} from '@/features/settings/hooks/use-templates';
import { useCategories } from '@/features/settings/hooks/use-categories';
import { Plus, Trash2, Loader2, Tag, Sparkles, AlertCircle, Pencil, X, Check } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { ImportTemplatesDialog } from './import-templates-dialog';

const DEFAULT_ICONS = [
    '💻', '🖥️', '⌨️', '🖱️', '📱', '🎧', '📷', '🖨️',
    '📚', '✏️', '📐', '🎨', '⚽', '🎵', '🔬', '🧪',
    '🔧', '⚙️', '🧹', '📦', '📌', '📓', '🎤', '🔊'
];

export function TemplatesSettings() {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    
    const { data: categories = [], isLoading: categoriesLoading } = useCategories();
    const { data: templates = [], isLoading, isError, refetch } = useTemplates(
        selectedCategoryId === 'all' ? undefined : selectedCategoryId
    );
    const createMutation = useCreateTemplate();
    const updateMutation = useUpdateTemplate();
    const deleteMutation = useDeleteTemplate();

    const [showModal, setShowModal] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ResourceTemplate | null>(null);
    const [deletingTemplate, setDeletingTemplate] = useState<ResourceTemplate | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        icon: '📦',
        categoryId: '',
    });

    const handleSave = async () => {
        if (editingTemplate) {
            await updateMutation.mutateAsync({
                id: editingTemplate.id,
                name: formData.name,
                icon: formData.icon,
            });
        } else {
            await createMutation.mutateAsync({
                categoryId: formData.categoryId,
                name: formData.name,
                icon: formData.icon,
            });
        }
        setShowModal(false);
        setEditingTemplate(null);
        setFormData({ name: '', icon: '📦', categoryId: '' });
    };

    const handleDelete = async () => {
        if (deletingTemplate) {
            await deleteMutation.mutateAsync(deletingTemplate.id);
            setDeletingTemplate(null);
        }
    };

    const openCreate = () => {
        setEditingTemplate(null);
        setFormData({ 
            name: '', 
            icon: '📦', 
            categoryId: selectedCategoryId !== 'all' ? selectedCategoryId : (categories[0]?.id || '')
        });
        setShowModal(true);
    };

    const openEdit = (template: ResourceTemplate) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            icon: template.icon,
            categoryId: template.categoryId,
        });
        setShowModal(true);
    };

    // Group templates by category
    const templatesByCategory = (Array.isArray(templates) ? templates : []).reduce((acc, template) => {
        const categoryId = template.categoryId || 'uncategorized';
        if (!acc[categoryId]) {
            acc[categoryId] = [];
        }
        acc[categoryId].push(template);
        return acc;
    }, {} as Record<string, ResourceTemplate[]>);

    if (isLoading || categoriesLoading) {
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
                <p className="text-rose-900 font-bold text-sm uppercase tracking-tight">Error al cargar templates</p>
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
            {/* Header / Filter Toolbar */}
            <div className="flex justify-between items-center gap-4 bg-muted/20 p-4 rounded-lg border border-border">
                <div className="flex-1 max-w-xs">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Filtrar por categoría</Label>
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger className="h-9 rounded-md border-border shadow-none font-bold text-xs bg-white">
                            <SelectValue placeholder="Todas las categorías" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las categorías</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                    <span className="flex items-center gap-2">
                                        <span>{category.icon}</span>
                                        <span>{category.name}</span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2 self-end">
                    <Button
                        variant="jiraOutline"
                        onClick={() => setShowImportDialog(true)}
                        className="h-9 font-black uppercase tracking-widest text-[11px] px-4"
                    >
                        <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
                        Bot de Templates
                    </Button>
                    <Button
                        variant="jira"
                        onClick={openCreate}
                        disabled={categories.length === 0}
                        className="h-9 font-black uppercase tracking-widest text-[11px] px-4"
                    >
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        Nuevo Template
                    </Button>
                </div>
            </div>

            {/* Empty States */}
            {categories.length === 0 ? (
                <div className="bg-card/20 border-2 border-dashed border-border/80 rounded-xl p-20 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-8 border border-border/50">
                        <Tag className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <div className="max-w-sm space-y-3">
                        <h3 className="font-black text-lg uppercase tracking-tight text-foreground">Primero crea categorías</h3>
                        <p className="text-[12px] text-muted-foreground font-medium mb-8 leading-relaxed">
                            Los templates (subcategorías) dependen de una categoría padre. Crea tu primera categoría para empezar a organizar tu inventario.
                        </p>
                    </div>
                </div>
            ) : templates.length === 0 ? (
                <div className="bg-card/20 border-2 border-dashed border-border/80 rounded-xl p-20 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-8 border border-border/50">
                        <Tag className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <div className="max-w-sm space-y-3">
                        <h3 className="font-black text-lg uppercase tracking-tight text-foreground">Sin templates definidos</h3>
                        <p className="text-[12px] text-muted-foreground font-medium mb-8 leading-relaxed">
                            Define templates específicos para tus recursos o importa la configuración predeterminada para ahorrar tiempo.
                        </p>
                    </div>
                    <div className="flex gap-3 mt-8">
                        <Button
                            variant="jiraOutline"
                            onClick={() => setShowImportDialog(true)}
                            className="h-11 px-8 rounded-md font-black uppercase tracking-widest text-[11px]"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Importar Predeterminados
                        </Button>
                        <Button
                            variant="jira"
                            onClick={openCreate}
                            className="h-11 px-8 rounded-md font-black uppercase tracking-widest text-[11px]"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Crear personalizado
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-10 px-1">
                    {/* Templates grouped by category */}
                    {Object.entries(templatesByCategory).map(([categoryId, categoryTemplates]) => {
                        const category = categories.find(c => c.id === categoryId);
                        if (!category && categoryId !== 'uncategorized') return null;

                        return (
                            <div key={categoryId} className="space-y-4">
                                <div className="flex items-center gap-3 border-b border-border pb-2">
                                    {category ? (
                                        <>
                                            <div 
                                                className="w-7 h-7 rounded flex items-center justify-center text-sm shadow-none border border-black/5 text-white"
                                                style={{ backgroundColor: category.color }}
                                            >
                                                {category.icon}
                                            </div>
                                            <h3 className="font-black text-[13px] uppercase tracking-[0.1em] text-foreground">
                                                {category.name}
                                                <span className="ml-2 text-muted-foreground font-bold text-[10px] bg-muted/50 px-2 py-0.5 rounded-full lowercase">
                                                    {categoryTemplates.length} item{categoryTemplates.length !== 1 ? 's' : ''}
                                                </span>
                                            </h3>
                                        </>
                                    ) : (
                                        <h3 className="font-black text-[13px] uppercase tracking-[0.1em] text-muted-foreground">
                                            Sin categoría asignada
                                        </h3>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                    {categoryTemplates.map((template) => (
                                        <div
                                            key={template.id}
                                            className="bg-white border border-border rounded-lg p-3.5 hover:border-primary/40 hover:bg-muted/10 transition-all group flex items-center justify-between shadow-none relative h-14"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="text-xl flex-shrink-0">
                                                    {template.icon}
                                                </div>
                                                <span className="font-bold text-[13px] text-foreground truncate leading-none">
                                                    {template.name}
                                                </span>
                                            </div>
                                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 absolute right-1.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEdit(template)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-white rounded-md border border-transparent hover:border-border"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeletingTemplate(template)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-md border border-transparent hover:border-border"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Modal - Jira Style */}
            <AlertDialog open={showModal} onOpenChange={(val) => {
                if (!val) {
                    setShowModal(false);
                    setEditingTemplate(null);
                }
            }}>
                <AlertDialogContent className="max-w-xl p-0 flex flex-col overflow-hidden border border-border shadow-none rounded-lg bg-white">
                    <AlertDialogHeader className="sr-only">
                        <AlertDialogTitle>{editingTemplate ? 'Editar Template' : 'Nuevo Template'}</AlertDialogTitle>
                    </AlertDialogHeader>

                    {/* Header */}
                    <div className="shrink-0 px-6 py-5 border-b border-border bg-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md flex items-center justify-center bg-muted/30 border border-border shrink-0">
                                <span className="text-xl">{formData.icon}</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground tracking-tight">
                                    {editingTemplate ? 'Editar Template' : 'Nuevo Template'}
                                </h3>
                                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                                    Define especificaciones para tus recursos
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => { setShowModal(false); setEditingTemplate(null); }}
                            className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 bg-[#f4f5f7]/30">
                        {!editingTemplate && (
                            <div className="space-y-3">
                                <Label htmlFor="template-category" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                                    Seleccionar Categoría <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                                    <SelectTrigger id="template-category" className="h-11 rounded-md border-border shadow-none font-bold bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/50 transition-all font-sans">
                                        <SelectValue placeholder="Busca una categoría..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                <span className="flex items-center gap-2">
                                                    <span>{category.icon}</span>
                                                    <span>{category.name}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label htmlFor="template-name" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                                Nombre del Template <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="template-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Laptop, Mesa, Proyector..."
                                className="h-11 text-sm rounded-md border-border focus:ring-4 focus:ring-primary/5 focus:border-primary/50 bg-white shadow-none font-bold placeholder:text-muted-foreground/40 transition-all font-sans"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                                Icono Representativo
                            </Label>
                            <div className="grid grid-cols-8 gap-2 bg-white p-3 rounded-md border border-border">
                                {DEFAULT_ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, icon })}
                                        className={cn(
                                            "h-10 w-10 rounded-md flex items-center justify-center text-xl transition-all border",
                                            formData.icon === icon
                                                ? 'bg-[#0052cc] text-white border-[#0052cc] scale-110 z-10'
                                                : 'bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border'
                                        )}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="shrink-0 p-5 border-t border-border bg-white flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => { setShowModal(false); setEditingTemplate(null); }}
                            className="text-[11px] font-black uppercase tracking-widest h-10 px-6 rounded-md hover:bg-muted text-muted-foreground"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={formData.name.trim().length === 0 || formData.categoryId.length === 0 || (createMutation.isPending || updateMutation.isPending)}
                            variant="jira"
                            className="h-10 px-8 rounded-md font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all shadow-none flex items-center gap-2"
                        >
                            {createMutation.isPending || updateMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Check className="h-3.5 w-3.5" />
                            )}
                            {editingTemplate ? 'Guardar Cambios' : 'Crear Template'}
                        </Button>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* Import Dialog */}
            <ImportTemplatesDialog
                open={showImportDialog}
                onOpenChange={setShowImportDialog}
                categories={categories}
                onSuccess={() => {
                    refetch();
                }}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
                <AlertDialogContent className="shadow-none border border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">¿Eliminar Template?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            El template <span className="font-bold text-foreground">"{deletingTemplate?.name}"</span> será eliminado permanentemente.
                            Los recursos que usen este template no se verán afectados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-muted hover:bg-muted/80 text-muted-foreground border-border h-10 text-[11px] font-black uppercase tracking-widest rounded-md focus:ring-0">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white border-none h-10 text-[11px] font-black uppercase tracking-widest rounded-md focus:ring-0"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar Template'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
