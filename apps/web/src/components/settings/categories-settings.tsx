'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    useCategories,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
    type Category,
} from '@/features/settings/hooks/use-categories';
import { Plus, Trash2, Loader2, Package, Sparkles, AlertCircle, Pencil } from 'lucide-react';
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
import { ImportCategoriesDialog } from './import-categories-dialog';

const DEFAULT_COLORS = [
    '#0052CC', '#0747A6', '#5243AA', '#403294',
    '#00875A', '#006644', '#FF5630', '#DE350B',
    '#FF8B00', '#FF991F', '#6554C0', '#403294'
];

const DEFAULT_ICONS = [
    '💻', '🖥️', '⌨️', '🖱️', '📱', '🎧', '📷', '🖨️',
    '📚', '✏️', '📐', '🎨', '⚽', '🎵', '🔬', '🧪'
];

export function CategoriesSettings() {
    const { data: categories = [], isLoading, isError, refetch } = useCategories();
    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();

    const [showModal, setShowModal] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        icon: '📦',
        color: DEFAULT_COLORS[0],
    });

    const handleSave = async () => {
        if (editingCategory) {
            await updateMutation.mutateAsync({
                id: editingCategory.id,
                name: formData.name,
                icon: formData.icon,
                color: formData.color,
            });
        } else {
            await createMutation.mutateAsync({
                name: formData.name,
                icon: formData.icon,
                color: formData.color,
            });
        }
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name: '', icon: '📦', color: DEFAULT_COLORS[0] });
    };

    const handleDelete = async () => {
        if (deletingCategory) {
            await deleteMutation.mutateAsync(deletingCategory.id);
            setDeletingCategory(null);
        }
    };

    const openCreate = () => {
        setEditingCategory(null);
        setFormData({ name: '', icon: '📦', color: DEFAULT_COLORS[0] });
        setShowModal(true);
    };

    const openEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            icon: category.icon,
            color: category.color,
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
                <p className="text-rose-900 font-bold text-sm uppercase tracking-tight">Error al cargar categorías</p>
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
                    className="bg-white hover:bg-muted/50 text-foreground border-border rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-9"
                >
                    <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
                    Importar Categorías
                </Button>
                <Button
                    onClick={openCreate}
                    className="bg-primary hover:bg-primary/90 text-white rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-9"
                >
                    <Plus className="h-3.5 w-3.5 mr-2" />
                    Nueva Categoría
                </Button>
            </div>

            {/* Categories List */}
            {categories.length === 0 ? (
                <div className="bg-card/30 border border-dashed border-border/80 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                        <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="max-w-xs space-y-2">
                        <h3 className="font-black text-sm uppercase tracking-tight text-foreground">Sin categorías</h3>
                        <p className="text-[11px] text-muted-foreground font-medium mb-6">
                            Importa las categorías predeterminadas o crea tus propias categorías personalizadas.
                        </p>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowImportDialog(true)}
                            className="bg-white border-border text-foreground hover:bg-muted/50 rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-10 px-6"
                        >
                            <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
                            Importar Predeterminadas
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
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="bg-card/40 border border-border rounded-lg p-4 hover:border-primary/40 hover:bg-card/60 transition-all group flex flex-col shadow-none relative"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-9 h-9 rounded-md flex items-center justify-center text-white shadow-none text-lg"
                                        style={{ backgroundColor: category.color }}
                                    >
                                        {category.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-black text-[13px] uppercase tracking-tight text-foreground line-clamp-1" title={category.name}>
                                            {category.name}
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEdit(category)}
                                        className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeletingCategory(category)}
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
                icon={formData.icon}
                title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                description={editingCategory
                    ? 'Modifica los detalles de la categoría.'
                    : 'Crea una nueva categoría para organizar tu inventario.'}
                formTitle="Detalles de la Categoría"
                onSubmit={handleSave}
                onCancel={() => setShowModal(false)}
                submitLabel={editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                canSubmit={formData.name.trim().length > 0 && !(createMutation.isPending || updateMutation.isPending)}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                sidebarChildren={
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/60 mb-4">Vista Previa</p>
                            <div 
                                className="w-full aspect-square rounded-xl flex items-center justify-center shadow-none text-6xl"
                                style={{ backgroundColor: formData.color }}
                            >
                                {formData.icon}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-white font-black text-sm uppercase tracking-tight truncate">
                                {formData.name || 'Nueva Categoría'}
                            </p>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                                {editingCategory ? 'Editando Categoría' : 'Nuevo Registro'}
                            </p>
                        </div>
                    </div>
                }
            >
                <div className="space-y-6 pt-2">
                    <div className="space-y-3">
                        <Label htmlFor="category-name" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                            Nombre de la Categoría <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="category-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Equipos Portátiles"
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

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                            Color
                        </Label>
                        <div className="grid grid-cols-6 gap-2">
                            {DEFAULT_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`h-10 w-10 rounded-md transition-all ${
                                        formData.color === color
                                            ? 'ring-2 ring-primary ring-offset-2'
                                            : ''
                                    }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </SimpleFormModal>

            {/* Import Dialog */}
            <ImportCategoriesDialog
                open={showImportDialog}
                onOpenChange={setShowImportDialog}
                existingCategories={categories}
                onSuccess={() => {
                    refetch();
                }}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
                <AlertDialogContent className="shadow-none border border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">¿Eliminar Categoría?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            La categoría <span className="font-bold text-foreground">"{deletingCategory?.name}"</span> será eliminada permanentemente.
                            Todos los recursos asociados perderán su categoría.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-md h-10 text-xs font-black uppercase tracking-widest border-border shadow-none">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-md h-10 text-xs font-black uppercase tracking-widest shadow-none"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar Categoría'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
