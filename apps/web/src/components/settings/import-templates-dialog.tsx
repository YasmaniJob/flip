'use client';

import { useState, useMemo } from 'react';
import { Check, Search, Sparkles, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategories, useCreateCategory } from '@/features/settings/hooks/use-categories';
import { useCreateTemplate } from '@/features/settings/hooks/use-templates';
import { useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// ─── Lista maestra de subcategorías estándar ───────────────────────────────────
const STANDARD_CATALOGUE = [
    {
        category: { name: 'Equipos Portátiles', icon: '💻', color: '#0052CC' },
        templates: [
            { name: 'Laptop', icon: '💻' },
            { name: 'Tablet', icon: '📱' },
            { name: 'Chromebook', icon: '🖥️' },
        ],
    },
    {
        category: { name: 'Displays y Multimedia', icon: '📺', color: '#0065FF' },
        templates: [
            { name: 'Proyector', icon: '📽️' },
            { name: 'Televisor', icon: '📺' },
            { name: 'Monitor', icon: '🖥️' },
        ],
    },
    {
        category: { name: 'Periféricos', icon: '🎧', color: '#2684FF' },
        templates: [
            { name: 'Mouse', icon: '🖱️' },
            { name: 'Teclado', icon: '⌨️' },
            { name: 'Auriculares', icon: '🎧' },
            { name: 'Webcam', icon: '📷' },
        ],
    },
    {
        category: { name: 'Red e Infraestructura', icon: '📡', color: '#00B8D9' },
        templates: [
            { name: 'Switch', icon: '🔀' },
            { name: 'Router', icon: '📡' },
            { name: 'Access Point', icon: '📶' },
        ],
    },
    {
        category: { name: 'Almacenamiento', icon: '💾', color: '#36B37E' },
        templates: [
            { name: 'Disco Duro Externo', icon: '💾' },
            { name: 'Memoria USB', icon: '🔌' },
        ],
    },
    {
        category: { name: 'Protección Eléctrica', icon: '🔋', color: '#FFAB00' },
        templates: [
            { name: 'UPS', icon: '🔋' },
            { name: 'Regleta', icon: '🔌' },
            { name: 'Estabilizador', icon: '⚡' },
        ],
    },
    {
        category: { name: 'Mobiliario', icon: '🪑', color: '#BF2600' },
        templates: [
            { name: 'Silla', icon: '🪑' },
            { name: 'Mesa', icon: '🪞' },
            { name: 'Estante', icon: '🗄️' },
        ],
    },
    {
        category: { name: 'Equipos de Audio', icon: '🎵', color: '#6554C0' },
        templates: [
            { name: 'Micrófono', icon: '🎤' },
            { name: 'Parlante', icon: '🔊' },
            { name: 'Amplificador', icon: '📻' },
        ],
    },
    {
        category: { name: 'Kits Educativos', icon: '🤖', color: '#00875A' },
        templates: [
            { name: 'Kit de Robótica', icon: '🤖' },
            { name: 'Impresora 3D', icon: '🖨️' },
            { name: 'Drone', icon: '🚁' },
        ],
    },
    {
        category: { name: 'Mantenimiento', icon: '🧰', color: '#505F79' },
        templates: [
            { name: 'Herramienta', icon: '🔧' },
            { name: 'Kit de Limpieza', icon: '🧹' },
        ],
    },
] as const;

type TemplateKey = `${string}||${string}`;

interface ImportTemplatesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: any[];
    onSuccess?: () => void;
}

export function ImportTemplatesDialog({ open, onOpenChange, categories, onSuccess }: ImportTemplatesDialogProps) {
    const [selected, setSelected] = useState<Set<TemplateKey>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [isImporting, setIsImporting] = useState(false);

    const { data: existingCategories = [] } = useCategories();
    const createCategoryMutation = useCreateCategory();
    const createTemplateMutation = useCreateTemplate();
    const queryClient = useQueryClient();

    const filteredCatalogue = useMemo(() => {
        if (!searchTerm.trim()) return STANDARD_CATALOGUE;
        const lower = searchTerm.toLowerCase();
        return STANDARD_CATALOGUE
            .map((group) => ({
                ...group,
                templates: group.templates.filter((t) => t.name.toLowerCase().includes(lower)),
            }))
            .filter((group) =>
                group.templates.length > 0 || group.category.name.toLowerCase().includes(lower),
            );
    }, [searchTerm]);

    const makeKey = (categoryName: string, templateName: string): TemplateKey =>
        `${categoryName}||${templateName}`;

    const toggleTemplate = (categoryName: string, templateName: string) => {
        const key = makeKey(categoryName, templateName);
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleGroup = (categoryName: string, templates: readonly { name: string; icon: string }[]) => {
        const keys = templates.map((t) => makeKey(categoryName, t.name));
        const allSelected = keys.every((k) => selected.has(k));
        setSelected((prev) => {
            const next = new Set(prev);
            if (allSelected) keys.forEach((k) => next.delete(k));
            else keys.forEach((k) => next.add(k));
            return next;
        });
    };

    const toggleCollapse = (name: string) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selected.size > 0) {
            setSelected(new Set());
        } else {
            const allKeys = new Set<TemplateKey>();
            filteredCatalogue.forEach((group) =>
                group.templates.forEach((t) => allKeys.add(makeKey(group.category.name, t.name))),
            );
            setSelected(allKeys);
        }
    };

    const handleImport = async () => {
        if (selected.size === 0) return;
        setIsImporting(true);
        try {
            // Group selected items by category
            const byCategory = new Map<string, {
                categoryDef: typeof STANDARD_CATALOGUE[number]['category'];
                templates: { name: string; icon: string }[];
            }>();

            STANDARD_CATALOGUE.forEach((group) => {
                group.templates.forEach((t) => {
                    if (!selected.has(makeKey(group.category.name, t.name))) return;
                    if (!byCategory.has(group.category.name)) {
                        byCategory.set(group.category.name, { categoryDef: group.category, templates: [] });
                    }
                    byCategory.get(group.category.name)!.templates.push(t);
                });
            });

            // Create categories (if missing) then templates
            for (const [catName, { categoryDef, templates }] of byCategory) {
                const existing = existingCategories.find(
                    (c) => c.name.toLowerCase() === catName.toLowerCase(),
                );
                let categoryId: string;
                if (existing) {
                    categoryId = existing.id;
                } else {
                    const newCat = await createCategoryMutation.mutateAsync({
                        name: categoryDef.name,
                        icon: categoryDef.icon,
                        color: categoryDef.color,
                    });
                    categoryId = newCat.id;
                }
                for (const t of templates) {
                    await createTemplateMutation.mutateAsync({ categoryId, name: t.name, icon: t.icon });
                }
            }

            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            onSuccess?.();
            onOpenChange(false);
            setSelected(new Set());
            setSearchTerm('');
        } catch (error) {
            console.error('Error importing templates:', error);
        } finally {
            setIsImporting(false);
        }
    };

    const handleClose = () => {
        if (isImporting) return;
        setSelected(new Set());
        setSearchTerm('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[620px] max-h-[85vh] flex flex-col p-0 shadow-none border border-border gap-0 rounded-md">
                <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Importar Subcategorías Estándar
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-1">
                        Selecciona las subcategorías que usa tu institución. Se crearán sus categorías padre automáticamente si es necesario.
                    </DialogDescription>
                </DialogHeader>

                {/* Toolbar */}
                <div className="shrink-0 px-6 py-3 border-b border-border flex items-center gap-3 bg-muted/20">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar subcategorías..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-8 bg-background border border-border rounded-md pl-9 pr-3 text-xs font-medium focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="h-8 px-3 text-[10px] font-black uppercase tracking-widest border border-border rounded-md hover:border-primary/50 hover:bg-accent/50 transition-colors flex items-center gap-1.5 shrink-0"
                    >
                        <Check className="h-3 w-3" />
                        {selected.size > 0 ? 'Quitar todo' : 'Seleccionar todo'}
                    </button>
                    {selected.size > 0 && (
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest shrink-0">
                            {selected.size} sel.
                        </span>
                    )}
                </div>

                {/* Scrollable list */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 custom-scrollbar">
                    {filteredCatalogue.map((group) => {
                        const groupKeys = group.templates.map((t) => makeKey(group.category.name, t.name));
                        const allGroupSel = groupKeys.every((k) => selected.has(k));
                        const someGroupSel = groupKeys.some((k) => selected.has(k));
                        const isCollapsed = collapsedGroups.has(group.category.name);

                        return (
                            <div key={group.category.name}>
                                {/* Category separator */}
                                <div className="flex items-center gap-2 mb-2.5">
                                    <button
                                        type="button"
                                        onClick={() => toggleCollapse(group.category.name)}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {isCollapsed
                                            ? <ChevronRight className="h-3.5 w-3.5" />
                                            : <ChevronDown className="h-3.5 w-3.5" />
                                        }
                                    </button>
                                    <span className="text-base leading-none">{group.category.icon}</span>
                                    <span
                                        className="text-[10px] font-black uppercase tracking-widest flex-1"
                                        style={{ color: group.category.color }}
                                    >
                                        {group.category.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(group.category.name, group.templates)}
                                        className={cn(
                                            'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border transition-colors',
                                            allGroupSel
                                                ? 'border-primary/30 bg-primary/5 text-primary'
                                                : someGroupSel
                                                    ? 'border-primary/20 text-primary/60'
                                                    : 'border-border text-muted-foreground hover:border-primary/30 hover:text-primary',
                                        )}
                                    >
                                        {allGroupSel ? 'Quitar todos' : 'Todos'}
                                    </button>
                                </div>

                                {/* Template cards */}
                                {!isCollapsed && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 ml-5">
                                        {group.templates.map((t) => {
                                            const key = makeKey(group.category.name, t.name);
                                            const isSel = selected.has(key);
                                            return (
                                                <button
                                                    key={t.name}
                                                    type="button"
                                                    onClick={() => toggleTemplate(group.category.name, t.name)}
                                                    className={cn(
                                                        'flex items-center gap-2.5 px-3 py-2.5 rounded-md border transition-all text-left group',
                                                        isSel
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-border bg-background hover:border-primary/40 hover:bg-muted/20',
                                                    )}
                                                >
                                                    <span className={cn(
                                                        'text-lg leading-none transition-transform group-hover:scale-110',
                                                        !isSel && 'grayscale group-hover:grayscale-0',
                                                    )}>
                                                        {t.icon}
                                                    </span>
                                                    <span className={cn(
                                                        'text-xs font-bold uppercase tracking-tight flex-1 truncate',
                                                        isSel ? 'text-primary' : 'text-foreground',
                                                    )}>
                                                        {t.name}
                                                    </span>
                                                    <div className={cn(
                                                        'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                                                        isSel ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/40',
                                                    )}>
                                                        {isSel && <Check className="h-2.5 w-2.5 text-white stroke-[3]" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filteredCatalogue.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-xs text-muted-foreground font-medium">
                                No se encontraron subcategorías con "{searchTerm}"
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground font-medium">
                        {selected.size === 0
                            ? 'Selecciona al menos una subcategoría'
                            : `${selected.size} subcategoría${selected.size !== 1 ? 's' : ''} seleccionada${selected.size !== 1 ? 's' : ''}`
                        }
                    </p>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isImporting}
                            className="h-9 px-4 rounded-md text-xs font-black uppercase tracking-widest border-border shadow-none"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={selected.size === 0 || isImporting}
                            className="h-9 px-5 rounded-md text-xs font-black uppercase tracking-widest shadow-none"
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                    Importando...
                                </>
                            ) : 'Importar seleccionadas'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
