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
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                        <input
                            type="text"
                            placeholder="Buscar categorías..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:bg-white/20 transition-all font-medium text-sm"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="w-full py-2.5 px-4 bg-white/5 border border-white/10 rounded-xl text-white/80 text-xs font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <Check className="h-3.5 w-3.5" />
                        {selected.length > 0 ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                    </button>

                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10 mt-2">
                        <div className="flex items-center gap-2 text-white/80 mb-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                            <span className="font-bold text-xs">Beneficios</span>
                        </div>
                        <p className="text-[10px] text-white/60 leading-relaxed">
                            Configuración optimizada y compatibilidad con reportes del sector.
                        </p>
                    </div>
                </div>
            }
        >
            <div className="py-2">
                <div className="grid grid-cols-1 gap-2">
                    {filteredCategories.map((cat) => {
                        const isSelected = selected.includes(cat.name);
                        const isDuplicate = existingCategories.some(ec => ec.name.toLowerCase() === cat.name.toLowerCase());

                        return (
                            <div
                                key={cat.name}
                                onClick={() => handleToggle(cat.name, isDuplicate)}
                                className={cn(
                                    "group flex items-center gap-4 p-3 rounded-xl border transition-all relative overflow-hidden",
                                    isDuplicate
                                        ? "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed"
                                        : "cursor-pointer",
                                    !isDuplicate && isSelected
                                        ? "bg-emerald-50 border-emerald-200 shadow-sm"
                                        : !isDuplicate && "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-transform duration-300",
                                        !isDuplicate && "group-hover:scale-110",
                                        isSelected ? "bg-white shadow-sm" : "bg-gray-100"
                                    )}
                                >
                                    {cat.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className={cn(
                                            "font-semibold transition-colors",
                                            isSelected ? "text-emerald-900" : "text-gray-700"
                                        )}>
                                            {cat.name}
                                        </h4>
                                        {isDuplicate && (
                                            <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                                                Ya existe
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: cat.color }}
                                        />
                                        <span className="text-xs text-gray-400 font-medium">Estándar</span>
                                    </div>
                                </div>
                                <div className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                    isDuplicate ? "border-gray-200 bg-gray-100" : (
                                        isSelected
                                            ? "bg-emerald-500 border-emerald-500"
                                            : "border-gray-200 group-hover:border-emerald-300"
                                    )
                                )}>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                                    {isDuplicate && <Check className="h-3.5 w-3.5 text-gray-300" />}
                                </div>
                            </div>
                        );
                    })}

                    {filteredCategories.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <p>No se encontraron categorías con "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            </div>
        </SimpleFormModal>
    );
}
