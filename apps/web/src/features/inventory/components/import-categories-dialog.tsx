'use client';

import { useState } from 'react';
import { SimpleFormModal } from '@/components/molecules/wizard-modal';
import { Check, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSeedCategories, type Category } from '@/features/inventory/hooks/use-categories';

const AVAILABLE_CATEGORIES = [
    { name: 'Equipos Portátiles', icon: '💻', color: '#3b82f6' },
    { name: 'Componentes PC', icon: '🖥️', color: '#8b5cf6' },
    { name: 'Displays y Multimedia', icon: '📺', color: '#ec4899' },
    { name: 'Cables y Conectores', icon: '🔌', color: '#f59e0b' },
    { name: 'Periféricos', icon: '🎧', color: '#10b981' },
    { name: 'Red e Infraestructura', icon: '📡', color: '#06b6d4' },
    { name: 'Almacenamiento', icon: '💾', color: '#6366f1' },
    { name: 'Protección Eléctrica', icon: '🔋', color: '#f97316' },
    { name: 'Mobiliario', icon: '🪑', color: '#84cc16' },
    { name: 'Software y Licencias', icon: '💿', color: '#a855f7' },
    { name: 'Streaming y Producción', icon: '🎬', color: '#ec4899' },
    { name: 'Kits Educativos', icon: '🤖', color: '#14b8a6' },
    { name: 'Presentación', icon: '📍', color: '#f59e0b' },
    { name: 'Seguridad Física', icon: '🔒', color: '#ef4444' },
    { name: 'Mantenimiento', icon: '🧰', color: '#64748b' },
];

interface ImportCategoriesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    existingCategories?: Category[];
}

export function ImportCategoriesDialog({ open, onOpenChange, onSuccess, existingCategories = [] }: ImportCategoriesDialogProps) {
    const [selected, setSelected] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const seedMutation = useSeedCategories();

    const filteredCategories = AVAILABLE_CATEGORIES.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggle = (name: string, isDuplicate: boolean) => {
        if (isDuplicate) return;
        setSelected(prev =>
            prev.includes(name)
                ? prev.filter(item => item !== name)
                : [...prev, name]
        );
    };

    const handleSelectAll = () => {
        if (selected.length > 0) {
            setSelected([]);
        } else {
            // Select all valid (non-duplicate) categories
            const validCategories = filteredCategories
                .filter(c => !existingCategories.some(ec => ec.name === c.name))
                .map(c => c.name);
            setSelected(validCategories);
        }
    };

    const handleImport = async () => {
        try {
            await seedMutation.mutateAsync(selected);
            onSuccess?.();
            onOpenChange(false);
            setSelected([]);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <SimpleFormModal
            open={open}
            onOpenChange={onOpenChange}
            icon="📥"
            title="Importar Categorías Estándar"
            description="Selecciona las categorías que deseas importar a tu institución. Puedes editarlas o eliminarlas después."
            formTitle={`Seleccionadas: ${selected.length}`}

            onSubmit={handleImport}
            onCancel={() => onOpenChange(false)}
            submitLabel="Importar Seleccionadas"
            canSubmit={selected.length > 0 && !seedMutation.isPending}
            isSubmitting={seedMutation.isPending}
            sidebarChildren={
                <div className="w-full space-y-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background border border-border rounded-md py-2 pl-9 pr-4 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-all font-bold text-[11px] uppercase tracking-widest shadow-none"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="w-full py-2 px-4 bg-background border border-border rounded-md text-foreground text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-colors flex items-center justify-center gap-2 shadow-none"
                    >
                        <Check className="h-3 w-3" />
                        {selected.length > 0 ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                    </button>

                    <div className="bg-card rounded-md p-4 border border-border mt-2 shadow-none">
                        <div className="flex items-center gap-2 text-foreground mb-2">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <span className="font-black text-[10px] uppercase tracking-widest">Beneficios</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                            Configuración optimizada y compatibilidad con reportes del sector.
                        </p>
                    </div>
                </div>
            }
        >
            <div className="py-2">
                <div className="grid grid-cols-1 gap-1.5">
                    {filteredCategories.map((cat) => {
                        const isSelected = selected.includes(cat.name);
                        const isDuplicate = existingCategories.some(ec => ec.name.toLowerCase() === cat.name.toLowerCase());

                        return (
                            <div
                                key={cat.name}
                                onClick={() => handleToggle(cat.name, isDuplicate)}
                                className={cn(
                                    "group flex items-center gap-4 p-3 rounded-md border transition-all relative overflow-hidden shadow-none",
                                    isDuplicate
                                        ? "bg-muted/30 border-border opacity-60 cursor-not-allowed"
                                        : "cursor-pointer",
                                    !isDuplicate && isSelected
                                        ? "bg-primary/[0.03] border-primary/40"
                                        : !isDuplicate && "bg-card border-border hover:border-primary/20 hover:bg-muted/10"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-9 h-9 rounded-md flex items-center justify-center text-xl transition-all shadow-none",
                                        isSelected ? "bg-primary/20" : "bg-muted border border-border"
                                    )}
                                >
                                    {cat.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className={cn(
                                            "font-semibold transition-colors",
                                            isSelected ? "text-emerald-900 dark:text-emerald-100" : "text-foreground"
                                        )}>
                                            {cat.name}
                                        </h4>
                                        {isDuplicate && (
                                            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                                                Ya existe
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: cat.color }}
                                        />
                                        <span className="text-xs text-muted-foreground font-medium">Estándar</span>
                                    </div>
                                </div>
                                <div className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                    isDuplicate ? "border-border bg-muted" : (
                                        isSelected
                                            ? "bg-emerald-500 border-emerald-500"
                                            : "border-border group-hover:border-emerald-300"
                                    )
                                )}>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                                    {isDuplicate && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
                                </div>
                            </div>
                        );
                    })}

                    {filteredCategories.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No se encontraron categorías con "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            </div>
        </SimpleFormModal>
    );
}
