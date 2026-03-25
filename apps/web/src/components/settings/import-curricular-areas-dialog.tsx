import { useState, useMemo } from 'react';
import { SimpleFormModal } from '@/components/molecules/wizard-modal';
import { useSeedStandardAreas, type CurricularArea } from '@/features/settings/hooks/use-curricular-areas';
import { Check, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportCurricularAreasDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    existingAreas: CurricularArea[];
    onSuccess?: () => void;
}

// Standard Areas CNEB (Must match backend or be superset)
const STANDARD_AREAS = [
    { name: 'Matemática', icon: '📐', description: 'Resolución de problemas' },
    { name: 'Comunicación', icon: '💬', description: 'Lectura, escritura y oralidad' },
    { name: 'Ciencia y Tecnología', icon: '🔬', description: 'Indagación y alfabetización científica' },
    { name: 'Personal Social', icon: '🤝', description: 'Autoestima y convivencia (Primaria)' },
    { name: 'Desarrollo Personal, Ciudadanía y Cívica', icon: '⚖️', description: 'Valores y ciudadanía (Secundaria)' },
    { name: 'Ciencias Sociales', icon: '🌍', description: 'Historia y geografía (Secundaria)' },
    { name: 'Arte y Cultura', icon: '🎨', description: 'Apreciación y expresión artística' },
    { name: 'Educación Física', icon: '🏃', description: 'Vida activa y saludable' },
    { name: 'Educación Religiosa', icon: '⛪', description: 'Valores espirituales' },
    { name: 'Inglés', icon: '🇬🇧', description: 'Lengua extranjera' },
    { name: 'Educación para el Trabajo', icon: '💼', description: 'Emprendimiento (Secundaria)' },
    { name: 'Tutoría', icon: '👥', description: 'Orientación educativa' },
];

export function ImportCurricularAreasDialog({
    open,
    onOpenChange,
    existingAreas,
    onSuccess,
}: ImportCurricularAreasDialogProps) {
    const seedMutation = useSeedStandardAreas();
    const [selected, setSelected] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAreas = useMemo(() => {
        return STANDARD_AREAS.filter(area =>
            area.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const handleToggle = (name: string, isDuplicate: boolean) => {
        if (isDuplicate) return;
        setSelected(prev =>
            prev.includes(name)
                ? prev.filter(item => item !== name)
                : [...prev, name]
        );
    };

    const handleSelectAll = () => {
        const availableNames = filteredAreas
            .filter(a => !existingAreas.some(ea => ea.name.toLowerCase() === a.name.toLowerCase()))
            .map(a => a.name);

        if (selected.length === availableNames.length && availableNames.length > 0) {
            setSelected([]);
        } else {
            setSelected(availableNames);
        }
    };

    const handleImport = async () => {
        if (selected.length === 0) return;

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
            icon="📖"
            title="Importar Áreas CNEB"
            description="Selecciona las áreas curriculares estándar que deseas activar en tu institución."
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
                            placeholder="Buscar áreas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-background/10 border border-white/20 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:bg-background/20 transition-all font-medium text-sm"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="w-full py-2.5 px-4 bg-background/5 border border-white/10 rounded-full text-white/80 text-xs font-semibold hover:bg-background/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <Check className="h-3.5 w-3.5" />
                        {selected.length > 0 ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                    </button>

                    <div className="bg-background/5 rounded-2xl p-3 border border-white/10 mt-2">
                        <div className="flex items-center gap-2 text-white/80 mb-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                            <span className="font-bold text-xs">Información</span>
                        </div>
                        <p className="text-[10px] text-white/60 leading-relaxed">
                            Las áreas estándar incluyen sus competencias y capacidades oficiales del MINEDU.
                        </p>
                    </div>
                </div>
            }
        >
            <div className="py-2">
                <div className="grid grid-cols-1 gap-2">
                    {filteredAreas.map((area) => {
                        const isSelected = selected.includes(area.name);
                        const isDuplicate = existingAreas.some(ea => ea.name.toLowerCase() === area.name.toLowerCase());

                        return (
                            <div
                                key={area.name}
                                onClick={() => handleToggle(area.name, isDuplicate)}
                                className={cn(
                                    "group flex items-center gap-4 p-3 rounded-xl border transition-all relative overflow-hidden select-none",
                                    isDuplicate
                                        ? "bg-muted/30 border-border opacity-60 cursor-not-allowed"
                                        : "cursor-pointer",
                                    !isDuplicate && isSelected
                                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 shadow-sm"
                                        : !isDuplicate && "bg-card border-border hover:border-border/80 hover:bg-muted/20"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-transform duration-300",
                                        !isDuplicate && "group-hover:scale-110",
                                        isSelected ? "bg-card shadow-sm" : "bg-muted"
                                    )}
                                >
                                    {area.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className={cn(
                                            "font-semibold transition-colors",
                                            isSelected ? "text-emerald-900 dark:text-emerald-100" : "text-foreground"
                                        )}>
                                            {area.name}
                                        </h4>
                                        {isDuplicate && (
                                            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                                                Activa
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        {area.description}
                                    </p>
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

                    {filteredAreas.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No se encontraron áreas con "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            </div>
        </SimpleFormModal>
    );
}
