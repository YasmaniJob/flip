'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, ChevronLeft, Plus, Loader2, AlertCircle, CheckCircle2, Building2, Pencil, Trash2 } from 'lucide-react';
import { CATEGORY_EMOJIS } from '@/components/molecules/emoji-picker';
import { CATEGORY_COLORS } from '@/components/molecules/color-picker';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/features/inventory/hooks/use-categories';
import { useTemplates, useCreateTemplate } from '@/features/inventory/hooks/use-resources';
import { WizardLayout } from '@/components/layouts/wizard-layout';
import type { WizardData } from './resource-wizard';
import { ConfirmDeleteDialog } from '@/components/molecules/confirm-delete-dialog';

interface WizardStep1Props {
    data: Partial<WizardData>;
    onNext: (data: Partial<WizardData>) => void;
    onCancel: () => void;
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;
}

export function WizardStep1({ data, onNext, onCancel, isFullscreen, onToggleFullscreen }: WizardStep1Props) {
    const [selectedCategoryId, setSelectedCategoryId] = useState(data.categoryId);
    const [selectedTemplateId, setSelectedTemplateId] = useState(data.templateId);
    const [viewingTemplates, setViewingTemplates] = useState(false);

    // Inline category creation state
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryIcon, setNewCategoryIcon] = useState('📦');
    const [newCategoryColor, setNewCategoryColor] = useState('#2563eb');
    const [categoryError, setCategoryError] = useState<string | null>(null);

    // Inline category editing state
    const [editingCategory, setEditingCategory] = useState<any>(null);

    // Category deletion state
    const [deletingCategory, setDeletingCategory] = useState<any>(null);

    const createCategoryMutation = useCreateCategory();
    const updateCategoryMutation = useUpdateCategory();
    const deleteCategoryMutation = useDeleteCategory();

    // Inline subcategory (template) creation state
    const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false);
    const [newSubcategoryName, setNewSubcategoryName] = useState('');
    const [newSubcategoryIcon, setNewSubcategoryIcon] = useState('📄');
    const [subcategoryError, setSubcategoryError] = useState<string | null>(null);

    const createTemplateMutation = useCreateTemplate();

    const {
        data: categories = [],
        isLoading: categoriesLoading,
        isError: categoriesError,
    } = useCategories();

    const {
        data: templates = [],
        isLoading: templatesLoading,
    } = useTemplates(selectedCategoryId);

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    const canProceed = !!selectedCategoryId;

    const handleCategoryClick = (categoryId: string) => {
        setSelectedCategoryId(categoryId);
        setSelectedTemplateId(undefined);
        setViewingTemplates(true);
    };



    const handleBackToCategories = () => {
        setViewingTemplates(false);
    };

    const handleStartCreateCategory = () => {
        setIsCreatingCategory(true);
        setNewCategoryName('');
        setNewCategoryIcon('📦');
        setNewCategoryColor('#10b981');
        setCategoryError(null);
    };

    const handleCancelCreateCategory = () => {
        setIsCreatingCategory(false);
        setCategoryError(null);
    };

    const handleSaveCategory = async () => {
        const trimmedName = newCategoryName.trim();

        // Validación
        if (trimmedName.length < 3) {
            setCategoryError('El nombre debe tener al menos 3 caracteres');
            return;
        }
        if (trimmedName.length > 50) {
            setCategoryError('El nombre no puede exceder 50 caracteres');
            return;
        }

        try {
            setCategoryError(null);
            const newCategory = await createCategoryMutation.mutateAsync({
                name: trimmedName,
                icon: newCategoryIcon,
                color: newCategoryColor,
            });

            // Auto-seleccionar y navegar a templates
            setSelectedCategoryId(newCategory.id);
            setIsCreatingCategory(false);
            setViewingTemplates(true);
        } catch (err) {
            setCategoryError(err instanceof Error ? err.message : 'Error al crear categoría');
        }
    };

    const handleStartEditCategory = (e: React.MouseEvent, category: any) => {
        e.stopPropagation();
        setEditingCategory(category);
        setNewCategoryName(category.name);
        setNewCategoryIcon(category.icon || '📦');
        setNewCategoryColor(category.color || '#10b981');
        setCategoryError(null);
        setIsCreatingCategory(false);
    };

    const handleCancelEditCategory = () => {
        setEditingCategory(null);
        setCategoryError(null);
    };

    const handleSaveEditCategory = async () => {
        if (!editingCategory) return;
        const trimmedName = newCategoryName.trim();

        if (trimmedName.length < 3) {
            setCategoryError('El nombre debe tener al menos 3 caracteres');
            return;
        }

        try {
            setCategoryError(null);
            await updateCategoryMutation.mutateAsync({
                id: editingCategory.id,
                name: trimmedName,
                icon: newCategoryIcon,
                color: newCategoryColor,
            });

            setEditingCategory(null);
        } catch (err) {
            setCategoryError(err instanceof Error ? err.message : 'Error al actualizar categoría');
        }
    };

    const handleDeleteCategory = async () => {
        if (!deletingCategory) return;
        try {
            await deleteCategoryMutation.mutateAsync(deletingCategory.id);
            setDeletingCategory(null);
            if (selectedCategoryId === deletingCategory.id) {
                setSelectedCategoryId(undefined);
            }
        } catch (err) {
            console.error('Error al eliminar categoría', err);
        }
    };

    // Subcategory handlers
    const handleStartCreateSubcategory = () => {
        setIsCreatingSubcategory(true);
        setNewSubcategoryName('');
        setNewSubcategoryIcon('📄');
        setSubcategoryError(null);
    };

    const handleCancelCreateSubcategory = () => {
        setIsCreatingSubcategory(false);
        setSubcategoryError(null);
    };

    const handleSaveSubcategory = async () => {
        const trimmedName = newSubcategoryName.trim();

        if (trimmedName.length < 2) {
            setSubcategoryError('El nombre debe tener al menos 2 caracteres');
            return;
        }

        if (!selectedCategoryId) {
            setSubcategoryError('Debes seleccionar una categoría primero');
            return;
        }

        try {
            setSubcategoryError(null);
            const newTemplate = await createTemplateMutation.mutateAsync({
                categoryId: selectedCategoryId,
                name: trimmedName,
                icon: newSubcategoryIcon,
            });

            // Auto-seleccionar el nuevo template
            setSelectedTemplateId(newTemplate.id);
            setIsCreatingSubcategory(false);
        } catch (err) {
            setSubcategoryError(err instanceof Error ? err.message : 'Error al crear subcategoría');
        }
    };

    const handleNext = () => {
        if (!canProceed) return;
        onNext({
            mode: data.mode || 'individual',
            quantity: 1,
            categoryId: selectedCategoryId,
            categoryName: selectedCategory?.name,
            templateId: selectedTemplateId,
            templateData: selectedTemplate ? {
                name: selectedTemplate.name,
                icon: selectedTemplate.icon || undefined,
                defaultBrand: selectedTemplate.defaultBrand || undefined,
                defaultModel: selectedTemplate.defaultModel || undefined,
            } : undefined,
        });
    };

    return (
        <>
            <WizardLayout
                title="Nuevo Recurso"
                description="Registra un nuevo recurso en el inventario."
                onClose={onCancel}
                isFullscreen={isFullscreen}
                onToggleFullscreen={onToggleFullscreen}
            >
                {/* Header */}
                <div className="shrink-0 px-8 pt-5 pb-3 border-b border-border flex items-center justify-between pr-20 bg-slate-50/30">
                    <div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
                            {viewingTemplates ? 'Seleccionar Subcategoría' : 'Seleccionar Categoría'}
                        </h3>
                        <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest mt-0.5">
                            {viewingTemplates ? 'Define el tipo específico de recurso.' : 'Clasifica el recurso para una mejor gestión.'}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar relative">
                    {/* INLINE CATEGORY CREATION OR EDITING */}
                    {(isCreatingCategory || editingCategory) ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                            {/* Back nav */}
                            <button
                                onClick={editingCategory ? handleCancelEditCategory : handleCancelCreateCategory}
                                className="flex items-center gap-1.5 mb-6 px-3 py-1.5 -ml-2 rounded-none border border-transparent hover:border-border hover:bg-slate-50 transition-all text-muted-foreground hover:text-foreground font-black uppercase tracking-widest text-[10px]"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                Volver a Categorías
                            </button>

                            <div className="w-full space-y-8">
                                {/* Name field */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                                        Nombre de la Categoría <span className="text-destructive">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors">
                                            <Building2 size={14} />
                                        </div>
                                        <Input
                                            id="category-name"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            placeholder="EJ: EQUIPOS DE AUDIO, MOBILIARIO..."
                                            className="w-full pl-9 pr-4 h-10 rounded-none border border-border bg-background text-xs font-bold uppercase tracking-tight focus-visible:ring-0 focus-visible:border-primary/50 shadow-none"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* Icon Selection */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3.5 w-0.5 bg-primary rounded-full" />
                                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Selecciona un Icono Representativo</h3>
                                    </div>
                                    <div className="grid grid-cols-8 sm:grid-cols-12 lg:grid-cols-16 gap-2">
                                        {CATEGORY_EMOJIS.map((emoji) => {
                                            const isSelected = newCategoryIcon === emoji;
                                            return (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => setNewCategoryIcon(emoji)}
                                                    className={cn(
                                                        "relative h-10 rounded-md border transition-all flex items-center justify-center text-xl group",
                                                        isSelected
                                                            ? "border-primary bg-primary/5"
                                                            : "border-border bg-background hover:border-primary/40 hover:bg-accent/50"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "transition-transform duration-200 group-hover:scale-110",
                                                        !isSelected && "grayscale group-hover:grayscale-0"
                                                    )}>
                                                        {emoji}
                                                    </span>
                                                    {isSelected && (
                                                        <div className="absolute -top-1 -right-1 animate-in zoom-in duration-150">
                                                            <div className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                                                <CheckCircle2 size={10} strokeWidth={3} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Color Selection */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3.5 w-0.5 bg-primary rounded-full" />
                                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Define el Color Identificador</h3>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                                        {CATEGORY_COLORS.map((color) => {
                                            const isSelected = newCategoryColor === color.value;
                                            return (
                                                <button
                                                    key={color.value}
                                                    type="button"
                                                    onClick={() => setNewCategoryColor(color.value)}
                                                    className={cn(
                                                        "relative py-2.5 px-3 rounded-md border transition-all flex items-center gap-2.5 group",
                                                        isSelected
                                                            ? "border-primary bg-primary/5"
                                                            : "border-border bg-background hover:border-primary/40 hover:bg-accent/50"
                                                    )}
                                                >
                                                    <div
                                                        className="w-4 h-4 rounded-full shrink-0 transition-transform group-hover:scale-110"
                                                        style={{ backgroundColor: color.value }}
                                                    />
                                                    <span className={cn(
                                                        "text-xs font-medium truncate transition-colors",
                                                        isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                                    )}>
                                                        {color.name}
                                                    </span>
                                                    {isSelected && (
                                                        <div className="absolute -top-1 -right-1 animate-in zoom-in duration-150">
                                                            <div className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                                                <CheckCircle2 size={10} strokeWidth={3} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="pt-4 flex items-center justify-between gap-4 border-t border-border">
                                    {categoryError ? (
                                        <div className="flex items-center gap-2 text-destructive text-xs font-medium animate-in fade-in slide-in-from-left-2">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            <span>{categoryError}</span>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                                            Campos con (*) son obligatorios
                                        </p>
                                    )}

                                    <div className="flex gap-2 shrink-0">
                                        <Button
                                            type="button"
                                            variant="jiraOutline"
                                            onClick={editingCategory ? handleCancelEditCategory : handleCancelCreateCategory}
                                            className="h-9 px-4 font-black uppercase tracking-widest text-[10px]"
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={editingCategory ? handleSaveEditCategory : handleSaveCategory}
                                            disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                                            variant="jira"
                                            className="h-9 px-5 font-black uppercase tracking-widest text-[10px]"
                                        >
                                            {(createCategoryMutation.isPending || updateCategoryMutation.isPending)
                                                ? <Loader2 className="animate-spin h-3.5 w-3.5" />
                                                : editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : !viewingTemplates ? (
                        // CATEGORIES GRID
                        <div>
                            {categoriesLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                                </div>
                            ) : categoriesError ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
                                    <h3 className="font-bold text-red-800">Error al cargar categorías</h3>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    <button
                                        type="button"
                                        onClick={handleStartCreateCategory}
                                        className="relative p-4 rounded-none border border-dashed border-border bg-slate-50/30 hover:bg-white hover:border-primary/50 transition-all duration-300 group flex flex-col items-center justify-center gap-3 min-h-[140px] shadow-none"
                                    >
                                        <div className="w-10 h-10 rounded-none bg-white border border-border group-hover:bg-primary/10 group-hover:border-primary/30 flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors shadow-none">
                                            <Plus className="h-5 w-5" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Nueva Categoría</p>
                                    </button>
                                    {categories.map((cat) => (
                                        <div
                                            key={cat.id}
                                            onClick={() => handleCategoryClick(cat.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleCategoryClick(cat.id);
                                                }
                                            }}
                                            tabIndex={0}
                                            role="button"
                                            className="relative p-4 rounded-none border border-border bg-white hover:border-primary/50 hover:bg-slate-50/50 transition-all duration-300 group flex flex-col items-center gap-3 overflow-hidden cursor-pointer shadow-none"
                                        >
                                            {/* Acciones CRUD */}
                                            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    type="button"
                                                    variant="jiraOutline"
                                                    size="icon"
                                                    onClick={(e) => handleStartEditCategory(e, cat)}
                                                    className="h-6 w-6 rounded-none text-muted-foreground/60 hover:text-foreground border-border shadow-none"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="jiraOutline"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeletingCategory(cat);
                                                    }}
                                                    className="h-6 w-6 rounded-none text-muted-foreground/60 hover:text-destructive border-border hover:border-destructive/30 shadow-none"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            <div className="w-12 h-12 rounded-none bg-slate-50 border border-border group-hover:bg-primary/5 group-hover:border-primary/20 group-hover:scale-105 flex items-center justify-center text-3xl transition-all duration-300 shadow-none">
                                                {cat.icon}
                                            </div>
                                            <div className="space-y-1 text-center w-full px-2">
                                                <p className="text-[11px] font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1 truncate w-full" title={cat.name}>{cat.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        // TEMPLATES / SUBCATEGORIES
                        <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                            {/* Header nav */}
                            <div className="flex items-center justify-between mb-6">
                                <button
                                    onClick={handleBackToCategories}
                                    className="flex items-center gap-1.5 px-3 py-1.5 -ml-2 rounded-none border border-transparent hover:border-border hover:bg-slate-50 transition-all text-muted-foreground hover:text-foreground font-black uppercase tracking-widest text-[10px]"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    Volver a Categorías
                                </button>

                                {selectedCategory && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-none border border-border shadow-none">
                                        <span className="text-sm">{selectedCategory.icon}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground pr-1">{selectedCategory.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Inline subcategory creation — same flat style as category form */}
                            {isCreatingSubcategory ? (
                                <div className="w-full space-y-6 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {/* Name field */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                                            Nombre de la Subcategoría <span className="text-destructive">*</span>
                                        </label>
                                        <Input
                                            value={newSubcategoryName}
                                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                                            placeholder="EJ: LAPTOP, PROYECTOR, SILLA..."
                                            className="w-full h-10 rounded-none border border-border bg-background text-xs font-bold uppercase tracking-tight focus-visible:ring-0 focus-visible:border-primary/50 shadow-none"
                                            autoFocus
                                        />
                                    </div>

                                    {/* Icon Selection */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3.5 w-0.5 bg-primary rounded-full" />
                                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Selecciona un Icono</h3>
                                        </div>
                                        <div className="grid grid-cols-8 sm:grid-cols-12 lg:grid-cols-16 gap-1.5">
                                            {CATEGORY_EMOJIS.map((emoji) => {
                                                const isSelected = newSubcategoryIcon === emoji;
                                                return (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        onClick={() => setNewSubcategoryIcon(emoji)}
                                                        className={cn(
                                                            "relative h-10 rounded-none border transition-all flex items-center justify-center text-xl group shadow-none",
                                                            isSelected
                                                                ? "border-primary bg-primary/5"
                                                                : "border-border bg-background hover:border-primary/40 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "transition-transform duration-200 group-hover:scale-110",
                                                            !isSelected && "grayscale group-hover:grayscale-0"
                                                        )}>
                                                            {emoji}
                                                        </span>
                                                        {isSelected && (
                                                            <div className="absolute -top-1 -right-1 animate-in zoom-in duration-150">
                                                                <div className="h-3.5 w-3.5 rounded-none bg-primary text-primary-foreground flex items-center justify-center shadow-none">
                                                                    <CheckCircle2 size={9} strokeWidth={3} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="pt-4 flex items-center justify-between gap-4 border-t border-border">
                                        {subcategoryError ? (
                                            <div className="flex items-center gap-2 text-destructive text-xs font-medium animate-in fade-in">
                                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                <span>{subcategoryError}</span>
                                            </div>
                                        ) : <div />}
                                        <div className="flex gap-2 shrink-0">
                                            <Button
                                                variant="jiraOutline"
                                                onClick={handleCancelCreateSubcategory}
                                                className="h-9 px-4 font-black uppercase tracking-widest text-[10px]"
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                onClick={handleSaveSubcategory}
                                                disabled={createTemplateMutation.isPending}
                                                variant="jira"
                                                className="h-9 px-5 font-black uppercase tracking-widest text-[10px]"
                                            >
                                                {createTemplateMutation.isPending
                                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    : 'Crear Subcategoría'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {templatesLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                </div>
                            ) : templates.length === 0 && !isCreatingSubcategory ? (
                                <div className="text-center py-10 bg-muted/20 rounded-md border border-dashed border-border">
                                    <div className="text-3xl mb-3 opacity-70">📁</div>
                                    <h3 className="font-bold text-foreground text-sm mb-1 uppercase tracking-wider">Sin subcategorías</h3>
                                    <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                                        Esta categoría no tiene subcategorías. Puedes crear una o continuar sin ella.
                                    </p>
                                    <div className="flex items-center justify-center gap-3">
                                        <Button onClick={handleStartCreateSubcategory} variant="jiraOutline" className="h-9 font-black uppercase tracking-widest text-[10px] px-6">
                                            <Plus className="h-3.5 w-3.5 mr-2" />
                                            Crear Subcategoría
                                        </Button>
                                        <Button onClick={handleNext} variant="jira" className="h-9 font-black uppercase tracking-widest text-[10px] px-6">
                                            Continuar sin Subcategoría
                                            <ChevronRight className="h-3.5 w-3.5 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            ) : !isCreatingSubcategory ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {/* Nueva subcategoría card */}
                                    <button
                                        onClick={handleStartCreateSubcategory}
                                        className="p-3 rounded-none border border-dashed border-border bg-slate-50/50 hover:bg-white hover:border-primary/50 transition-all flex items-center gap-3 group min-h-[72px] shadow-none"
                                    >
                                        <div className="w-8 h-8 rounded-none bg-white border border-border group-hover:bg-primary/5 group-hover:border-primary/20 flex items-center justify-center text-primary/40 group-hover:text-primary shrink-0 transition-colors shadow-none">
                                            <Plus className="h-4 w-4" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary text-left">Nueva Subcategoría</p>
                                    </button>

                                    {templates.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTemplateId(t.id)}
                                            className={cn(
                                                "p-3 rounded-none border text-left transition-all flex items-center gap-3 group min-h-[72px] shadow-none",
                                                selectedTemplateId === t.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border bg-white hover:border-primary/40 hover:bg-slate-50'
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-none border border-transparent flex items-center justify-center text-lg shrink-0 transition-all shadow-none",
                                                selectedTemplateId === t.id ? 'bg-primary/10 border-primary/20 scale-105' : 'bg-slate-50 border-border'
                                            )}>
                                                {t.icon || '📄'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className={cn(
                                                    "text-[11px] font-black uppercase tracking-tight truncate",
                                                    selectedTemplateId === t.id ? 'text-primary' : 'text-foreground'
                                                )}>
                                                    {t.name}
                                                </p>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-0.5">
                                                    {selectedTemplateId === t.id ? 'Seleccionado ✓' : 'Click para seleccionar'}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                <div className="shrink-0 p-5 border-t border-border bg-slate-50/50 flex items-center justify-between z-10 shadow-none">
                    <Button
                        variant="jiraOutline"
                        onClick={onCancel}
                        className="font-black uppercase tracking-widest text-[10px] h-10 px-6 min-w-[120px]"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={!canProceed || (viewingTemplates && templatesLoading)}
                        variant="jira"
                        className="h-10 px-8 font-black uppercase tracking-widest text-[11px]"
                    >
                        Siguiente
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </WizardLayout>
            <ConfirmDeleteDialog
                open={!!deletingCategory}
                onOpenChange={(open) => !open && setDeletingCategory(null)}
                title={deletingCategory ? `¿Eliminar "${deletingCategory.name}"?` : "¿Eliminar Categoría?"}
                description="Se eliminará la categoría permanentemente. Esto prevendrá que se creen nuevos recursos con ella."
                onConfirm={handleDeleteCategory}
                isLoading={deleteCategoryMutation.isPending}
            />
        </>
    );
}
