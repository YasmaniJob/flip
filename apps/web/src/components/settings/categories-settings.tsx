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
import { Plus, Trash2, Loader2, Package, Sparkles, AlertCircle, Pencil, X, Check } from 'lucide-react';
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

const DEFAULT_COLORS = [
    '#0052CC', '#0747A6', '#5243AA', '#403294',
    '#00875A', '#006644', '#FF5630', '#DE350B',
    '#FF8B00', '#FF991F', '#6554C0', '#8777D9'
];

const DEFAULT_ICONS = [
    '📦', '💻', '🖥️', '⌨️', '🖱️', '📱', '🎧', '📷', '🖨️',
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
                    variant="jiraOutline"
                    onClick={() => setShowImportDialog(true)}
                    className="h-9 font-black uppercase tracking-widest text-[11px] px-4"
                >
                    <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
                    Configurar Subcategorías
                </Button>
                <Button
                    variant="jira"
                    onClick={openCreate}
                    className="h-9 font-black uppercase tracking-widest text-[11px] px-4"
                >
                    <Plus className="h-3.5 w-3.5 mr-2" />
                    Nueva Categoría
                </Button>
            </div>

            {/* Categories List */}
            {categories.length === 0 ? (
                <div className="bg-card/20 border-2 border-dashed border-border/80 rounded-xl p-20 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-8 border border-border/50">
                        <Package className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <div className="max-w-sm space-y-3">
                        <h3 className="font-black text-lg uppercase tracking-tight text-foreground">Sin categorías en el inventario</h3>
                        <p className="text-[12px] text-muted-foreground font-medium mb-8 leading-relaxed">
                            Organiza tus recursos educativos creando categorías personalizadas o importa la configuración predeterminada del sistema.
                        </p>
                    </div>
                    <div className="flex gap-3 mt-8">
                        <Button
                            variant="jiraOutline"
                            onClick={() => setShowImportDialog(true)}
                            className="h-11 px-8 rounded-md font-black uppercase tracking-widest text-[11px]"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Configurar Subcategorías
                        </Button>
                        <Button
                            variant="jira"
                            onClick={openCreate}
                            className="h-11 px-8 rounded-md font-black uppercase tracking-widest text-[11px]"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Crear personalizada
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="bg-white border border-border rounded-lg p-5 hover:border-primary/40 hover:bg-muted/10 transition-all group flex flex-col shadow-none relative h-full min-h-[100px] justify-center"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div 
                                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-none text-2xl shrink-0 border border-black/5"
                                        style={{ backgroundColor: category.color }}
                                    >
                                        {category.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-[14px] uppercase tracking-tight text-foreground line-clamp-2 leading-tight" title={category.name}>
                                            {category.name}
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEdit(category)}
                                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeletingCategory(category)}
                                        className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-md"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal - Jira Style */}
            <AlertDialog open={showModal} onOpenChange={(val) => {
                if (!val) {
                    setShowModal(false);
                    setEditingCategory(null);
                }
            }}>
                <AlertDialogContent className="max-w-xl p-0 flex flex-col overflow-hidden border border-border shadow-none rounded-lg bg-white max-h-[85dvh] sm:max-h-[90vh] z-[100]">
                    <AlertDialogHeader className="sr-only">
                        <AlertDialogTitle>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</AlertDialogTitle>
                    </AlertDialogHeader>

                    {/* Header */}
                    <div className="shrink-0 px-6 py-5 border-b border-border bg-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div 
                                className="w-10 h-10 rounded-md flex items-center justify-center text-white shrink-0 border border-black/5"
                                style={{ backgroundColor: formData.color }}
                            >
                                <span className="text-xl">{formData.icon}</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground tracking-tight">
                                    {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                                </h3>
                            </div>
                        </div>
                        <button 
                            onClick={() => { setShowModal(false); setEditingCategory(null); }}
                            className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 bg-[#f4f5f7]/30">
                        {/* Name Field */}
                        <div className="space-y-3">
                            <Label htmlFor="category-name" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                                Nombre de la Categoría <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="category-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Laptops, Tablets, Muebles..."
                                className="h-11 text-sm rounded-md border-border focus:ring-4 focus:ring-primary/5 focus:border-primary/50 bg-white shadow-none font-bold placeholder:text-muted-foreground/40 transition-all font-sans"
                                autoFocus
                            />
                        </div>

                        {/* Icon Picker */}
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

                        {/* Color Picker */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                                Color de Identificación
                            </Label>
                            <div className="flex flex-wrap gap-2.5 bg-white p-3 rounded-md border border-border">
                                {DEFAULT_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color })}
                                        className={cn(
                                            "h-8 w-8 rounded-full transition-all border-2",
                                            formData.color === color
                                                ? 'border-white ring-2 ring-[#0052cc] scale-110'
                                                : 'border-transparent hover:scale-105'
                                        )}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="shrink-0 p-5 border-t border-border bg-white flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => { setShowModal(false); setEditingCategory(null); }}
                            className="text-[11px] font-black uppercase tracking-widest h-10 px-6 rounded-md hover:bg-muted text-muted-foreground"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={formData.name.trim().length === 0 || (createMutation.isPending || updateMutation.isPending)}
                            variant="jira"
                            className="h-10 px-8 rounded-md font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all shadow-none flex items-center gap-2"
                        >
                            {createMutation.isPending || updateMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Check className="h-3.5 w-3.5" />
                            )}
                            {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
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
                        <AlertDialogCancel className="bg-muted hover:bg-muted/80 text-muted-foreground border-border h-10 text-[11px] font-black uppercase tracking-widest rounded-md focus:ring-0">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white border-none h-10 text-[11px] font-black uppercase tracking-widest rounded-md focus:ring-0"
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
