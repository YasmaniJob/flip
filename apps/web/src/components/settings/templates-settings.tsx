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
import { Plus, Trash2, Loader2, Tag, Sparkles, AlertCircle, Pencil } from 'lucide-react';
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
    const templatesByCategory = templates.reduce((acc, template) => {
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
            {/* Header */}
            <div className="flex justify-between items-center gap-4">
                <div className="flex-1 max-w-xs">
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger className="h-9 rounded-md border-border shadow-none font-bold text-xs">
                            <SelectValue placeholder="Filtrar por categoría" />
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
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowImportDialog(true)}
                        className="bg-white hover:bg-muted/50 text-foreground border-border rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-9"
                    >
                        <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
                        Importar Templates
                    </Button>
                    <Button
                        onClick={openCreate}
                        disabled={categories.length === 0}
                        className="bg-primary hover:bg-primary/90 text-white rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-9"
                    >
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        Nuevo Template
                    </Button>
                </div>
            </div>

            {/* Empty State */}
            {categories.length === 0 ? (
                <div className="bg-card/30 border border-dashed border-border/80 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                        <Tag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="max-w-xs space-y-2">
                        <h3 className="font-black text-sm uppercase tracking-tight text-foreground">Sin categorías</h3>
                        <p className="text-[11px] text-muted-foreground font-medium mb-6">
                            Primero debes crear categorías antes de poder agregar templates.
                        </p>
                    </div>
                </div>
            ) : templates.length === 0 ? (
                <div className="bg-card/30 border border-dashed border-border/80 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                        <Tag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="max-w-xs space-y-2">
                        <h3 className="font-black text-sm uppercase tracking-tight text-foreground">Sin templates</h3>
                        <p className="text-[11px] text-muted-foreground font-medium mb-6">
                            Importa los templates predeterminados o crea tus propios templates personalizados.
                        </p>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowImportDialog(true)}
                            className="bg-white border-border text-foreground hover:bg-muted/50 rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-10 px-6"
                        >
                            <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
                            Importar Predeterminados
                        </Button>
                        <Button
                            onClick={openCreate}
                            className="bg-primary hover:bg-primary/90 text-white rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-10 px-6"
                        >
                            <Plus className="h-3.5 w-3.5 mr-2" />
                            Crear personalizado
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Templates grouped by category */}
                    {Object.entries(templatesByCategory).map(([categoryId, categoryTemplates]) => {
                        const category = categories.find(c => c.id === categoryId);
                        if (!category && categoryId !== 'uncategorized') return null;

                        return (
                            <div key={categoryId} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    {category && (
                                        <>
                                            <div 
                                                className="w-6 h-6 rounded flex items-center justify-center text-sm"
                                                style={{ backgroundColor: category.color }}
                                            >
                                                {category.icon}
                                            </div>
                                            <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground">
                                                {category.name}
                                            </h3>
                                        </>
                                    )}
                                    {categoryId === 'uncategorized' && (
                                        <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground">
                                            Sin categoría
                                        </h3>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {categoryTemplates.map((template) => (
                                        <div
                                            key={template.id}
                                            className="bg-card/40 border border-border rounded-lg p-3 hover:border-primary/40 hover:bg-card/60 transition-all group flex items-center justify-between shadow-none"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="text-xl flex-shrink-0">
                                                    {template.icon}
                                                </div>
                                                <span className="font-bold text-xs text-foreground truncate">
                                                    {template.name}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEdit(template)}
                                                    className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeletingTemplate(template)}
                                                    className="h-6 w-6 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-md"
                                                >
                                                    <Trash2 className="h-3 w-3" />
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

            {/* Create/Edit Modal */}
            <SimpleFormModal
                open={showModal}
                onOpenChange={setShowModal}
                icon={formData.icon}
                title={editingTemplate ? 'Editar Template' : 'Nuevo Template'}
                description={editingTemplate
                    ? 'Modifica los detalles del template.'
                    : 'Crea un nuevo template para tu inventario.'}
                formTitle="Detalles del Template"
                onSubmit={handleSave}
                onCancel={() => setShowModal(false)}
                submitLabel={editingTemplate ? 'Guardar Cambios' : 'Crear Template'}
                canSubmit={formData.name.trim().length > 0 && formData.categoryId.length > 0 && !(createMutation.isPending || updateMutation.isPending)}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                sidebarChildren={
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/60 mb-4">Vista Previa</p>
                            <div className="w-full aspect-square rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 shadow-none text-6xl">
                                {formData.icon}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-white font-black text-sm uppercase tracking-tight truncate">
                                {formData.name || 'Nuevo Template'}
                            </p>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                                {editingTemplate ? 'Editando Template' : 'Nuevo Registro'}
                            </p>
                        </div>
                    </div>
                }
            >
                <div className="space-y-6 pt-2">
                    {!editingTemplate && (
                        <div className="space-y-3">
                            <Label htmlFor="template-category" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                                Categoría <span className="text-rose-500">*</span>
                            </Label>
                            <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                                <SelectTrigger id="template-category" className="h-11 rounded-md border-border shadow-none font-bold">
                                    <SelectValue placeholder="Selecciona una categoría" />
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
                            placeholder="Ej: Laptop, Monitor, Teclado"
                            className="h-11 text-sm rounded-md border-border focus:ring-1 focus:ring-primary shadow-none font-bold"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                            Icono
                        </Label>
                        <div className="grid grid-cols-8 gap-2">
                            {DEFAULT_ICONS.map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, icon })}
                                    className={`h-10 w-10 rounded-md flex items-center justify-center text-xl transition-all ${
                                        formData.icon === icon
                                            ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                                            : 'bg-muted hover:bg-muted/80'
                                    }`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </SimpleFormModal>

            {/* Import Dialog */}
            <ImportTemplatesDialog
                open={showImportDialog}
                onOpenChange={setShowImportDialog}
                existingTemplates={templates}
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
                        <AlertDialogCancel className="rounded-md h-10 text-xs font-black uppercase tracking-widest border-border shadow-none">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-md h-10 text-xs font-black uppercase tracking-widest shadow-none"
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
