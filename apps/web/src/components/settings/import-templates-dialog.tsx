'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DEFAULT_TEMPLATES } from '@/lib/constants/default-templates';
import { useCreateTemplate, type ResourceTemplate } from '@/features/settings/hooks/use-templates';
import type { Category } from '@/features/settings/hooks/use-categories';
import { Loader2, Package, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ImportTemplatesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    existingTemplates: ResourceTemplate[];
    categories: Category[];
    onSuccess?: () => void;
}

export function ImportTemplatesDialog({
    open,
    onOpenChange,
    existingTemplates,
    categories,
    onSuccess,
}: ImportTemplatesDialogProps) {
    const createMutation = useCreateTemplate();
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [importing, setImporting] = useState(false);
    const [importComplete, setImportComplete] = useState(false);

    // Map category names to IDs
    const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.name] = cat.id;
        return acc;
    }, {} as Record<string, string>);

    // Get available categories (those that exist and have templates defined)
    const availableCategories = Object.keys(DEFAULT_TEMPLATES).filter(
        categoryName => categoryMap[categoryName]
    );

    // Count how many templates would be imported per category
    const getNewTemplatesCount = (categoryName: string) => {
        const categoryId = categoryMap[categoryName];
        if (!categoryId) return 0;

        const existingNames = new Set(
            existingTemplates
                .filter(t => t.categoryId === categoryId)
                .map(t => t.name.toLowerCase())
        );

        return DEFAULT_TEMPLATES[categoryName].filter(
            template => !existingNames.has(template.name.toLowerCase())
        ).length;
    };

    const handleImport = async () => {
        setImporting(true);
        try {
            for (const categoryName of selectedCategories) {
                const categoryId = categoryMap[categoryName];
                if (!categoryId) continue;

                const existingNames = new Set(
                    existingTemplates
                        .filter(t => t.categoryId === categoryId)
                        .map(t => t.name.toLowerCase())
                );

                const templatesToImport = DEFAULT_TEMPLATES[categoryName].filter(
                    template => !existingNames.has(template.name.toLowerCase())
                );

                for (const template of templatesToImport) {
                    await createMutation.mutateAsync({
                        categoryId,
                        name: template.name,
                        icon: template.icon,
                    });
                }
            }

            setImportComplete(true);
            setTimeout(() => {
                onSuccess?.();
                onOpenChange(false);
                setImportComplete(false);
                setSelectedCategories([]);
            }, 1500);
        } catch (error) {
            console.error('Error importing templates:', error);
        } finally {
            setImporting(false);
        }
    };

    const toggleCategory = (categoryName: string) => {
        setSelectedCategories(prev =>
            prev.includes(categoryName)
                ? prev.filter(c => c !== categoryName)
                : [...prev, categoryName]
        );
    };

    const selectAll = () => {
        const categoriesToSelect = availableCategories.filter(
            cat => getNewTemplatesCount(cat) > 0
        );
        setSelectedCategories(categoriesToSelect);
    };

    const deselectAll = () => {
        setSelectedCategories([]);
    };

    const totalNewTemplates = selectedCategories.reduce(
        (sum, cat) => sum + getNewTemplatesCount(cat),
        0
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl shadow-none border border-border">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Importar Templates Predeterminados
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        Selecciona las categorías cuyos templates deseas importar. Solo se importarán los templates que aún no existen.
                    </DialogDescription>
                </DialogHeader>

                {availableCategories.length === 0 ? (
                    <div className="py-12 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm font-medium text-muted-foreground">
                            No hay categorías disponibles. Primero debes crear categorías.
                        </p>
                    </div>
                ) : importComplete ? (
                    <div className="py-12 text-center">
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <p className="text-lg font-black uppercase tracking-tight text-foreground">
                            ¡Templates Importados!
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Se importaron {totalNewTemplates} templates exitosamente.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-end gap-2 mb-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={selectAll}
                                className="h-7 text-[10px] font-black uppercase tracking-widest"
                            >
                                Seleccionar Todos
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={deselectAll}
                                className="h-7 text-[10px] font-black uppercase tracking-widest"
                            >
                                Deseleccionar Todos
                            </Button>
                        </div>

                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-3">
                                {availableCategories.map((categoryName) => {
                                    const category = categories.find(c => c.name === categoryName);
                                    const newCount = getNewTemplatesCount(categoryName);
                                    const totalCount = DEFAULT_TEMPLATES[categoryName].length;
                                    const isChecked = selectedCategories.includes(categoryName);

                                    if (!category) return null;

                                    return (
                                        <div
                                            key={categoryName}
                                            className={`border rounded-lg p-4 transition-all ${
                                                isChecked
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border bg-card/40'
                                            } ${newCount === 0 ? 'opacity-50' : 'cursor-pointer hover:border-primary/40'}`}
                                            onClick={() => newCount > 0 && toggleCategory(categoryName)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    checked={isChecked}
                                                    disabled={newCount === 0}
                                                    onCheckedChange={() => toggleCategory(categoryName)}
                                                    className="mt-1"
                                                />
                                                <div 
                                                    className="w-10 h-10 rounded-md flex items-center justify-center text-white text-lg flex-shrink-0"
                                                    style={{ backgroundColor: category.color }}
                                                >
                                                    {category.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-black text-sm uppercase tracking-tight text-foreground">
                                                        {categoryName}
                                                    </h4>
                                                    <p className="text-[11px] text-muted-foreground font-medium mt-1">
                                                        {newCount > 0 ? (
                                                            <>
                                                                <span className="text-primary font-bold">{newCount} nuevos</span> de {totalCount} templates
                                                            </>
                                                        ) : (
                                                            <>Todos los templates ya están importados ({totalCount})</>
                                                        )}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {DEFAULT_TEMPLATES[categoryName].slice(0, 8).map((template, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="text-xs bg-muted px-2 py-0.5 rounded"
                                                                title={template.name}
                                                            >
                                                                {template.icon} {template.name}
                                                            </span>
                                                        ))}
                                                        {DEFAULT_TEMPLATES[categoryName].length > 8 && (
                                                            <span className="text-xs text-muted-foreground px-2 py-0.5">
                                                                +{DEFAULT_TEMPLATES[categoryName].length - 8} más
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>

                        <DialogFooter className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                {selectedCategories.length > 0 && (
                                    <span className="font-bold">
                                        {totalNewTemplates} templates serán importados
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={importing}
                                    className="rounded-md h-10 text-xs font-black uppercase tracking-widest border-border shadow-none"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleImport}
                                    disabled={selectedCategories.length === 0 || importing || totalNewTemplates === 0}
                                    className="bg-primary hover:bg-primary/90 text-white rounded-md h-10 text-xs font-black uppercase tracking-widest shadow-none"
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Importando...
                                        </>
                                    ) : (
                                        'Importar Templates'
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
