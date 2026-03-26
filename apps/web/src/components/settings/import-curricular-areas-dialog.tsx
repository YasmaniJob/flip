'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/atoms/button';
import { useSeedStandardAreas, type CurricularArea } from '@/features/settings/hooks/use-curricular-areas';
import { Check, Search, X, Loader2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportCurricularAreasDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    existingAreas: CurricularArea[];
    onSuccess?: () => void;
}

const STANDARD_AREAS = [
    { id: 'mat', name: 'Matemática', icon: '📐', description: 'Resolución de problemas' },
    { id: 'com', name: 'Comunicación', icon: '💬', description: 'Lectura, escritura y oralidad' },
    { id: 'cy t', name: 'Ciencia y Tecnología', icon: '🔬', description: 'Indagación y alfabetización científica' },
    { id: 'per', name: 'Personal Social', icon: '🤝', description: 'Autoestima y convivencia (Primaria)' },
    { id: 'dpc', name: 'Desarrollo Personal, Ciudadanía y Cívica', icon: '⚖️', description: 'Valores y ciudadanía (Secundaria)' },
    { id: 'csc', name: 'Ciencias Sociales', icon: '🌍', description: 'Historia y geografía (Secundaria)' },
    { id: 'ay c', name: 'Arte y Cultura', icon: '🎨', description: 'Apreciación y expresión artística' },
    { id: 'efi', name: 'Educación Física', icon: '🏃', description: 'Vida activa y saludable' },
    { id: 'rel', name: 'Educación Religiosa', icon: '⛪', description: 'Valores espirituales' },
    { id: 'ing', name: 'Inglés', icon: '🇬🇧', description: 'Lengua extranjera' },
    { id: 'ept', name: 'Educación para el Trabajo', icon: '💼', description: 'Emprendimiento (Secundaria)' },
    { id: 'tut', name: 'Tutoría', icon: '👥', description: 'Orientación educativa' },
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
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) {
                setSelected([]);
                setSearchTerm('');
            }
        }}>
            <DialogContent 
                showCloseButton={false}
                className="max-w-5xl lg:max-w-6xl h-[85vh] p-0 flex flex-col overflow-hidden border border-border shadow-none rounded-lg"
            >
                {/* Accessibility required DialogTitle (Visually Hidden) */}
                <DialogTitle className="sr-only">Importar Áreas Curriculares CNEB</DialogTitle>

                {/* ── Header ────────────────────────────────────────────────────────── */}
                <div className="shrink-0 px-8 py-6 border-b border-border bg-white">
                    <div className="flex items-center justify-between gap-12">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-md bg-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/10">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-2xl font-black text-foreground tracking-tighter whitespace-nowrap">
                                    Importar Áreas CNEB
                                </h3>
                                <p className="text-[12px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 opacity-70">
                                    Curriculo Nacional de la Educación Básica
                                </p>
                            </div>
                        </div>

                        {/* Search on the right - Fixed width */}
                        <div className="relative w-80 group shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar área curricular..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-muted/20 border border-border rounded-md h-11 pl-10 pr-4 text-sm font-bold focus:outline-none focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-muted-foreground/40"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted text-muted-foreground"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Toolbar ───────────────────────────────────────────────────────── */}
                <div className="shrink-0 px-6 py-3 flex items-center justify-between bg-muted/5 border-b border-border/60">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#0052cc] bg-[#ebf2ff] px-2 py-1 rounded">
                            Seleccionadas: {selected.length}
                        </span>
                        {selected.length > 0 && (
                            <button
                                onClick={() => setSelected([])}
                                className="text-[10px] font-bold text-muted-foreground hover:text-rose-600 transition-colors uppercase tracking-widest px-2"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                    
                    <button
                        onClick={handleSelectAll}
                        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                        <Check className={cn("h-3 w-3", selected.length > 0 && "text-primary")} />
                        {selected.length > 0 ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                    </button>
                </div>

                {/* ── Content ───────────────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-10 py-10 custom-scrollbar bg-[#f4f5f7]/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredAreas.map((area) => {
                            const isSelected = selected.includes(area.name);
                            const isDuplicate = existingAreas.some(ea => ea.name.toLowerCase() === area.name.toLowerCase());

                            return (
                                <div
                                    key={area.name}
                                    onClick={() => handleToggle(area.name, isDuplicate)}
                                    className={cn(
                                        "group flex items-center gap-4 p-3 rounded-md border transition-all relative overflow-hidden select-none bg-white",
                                        isDuplicate
                                            ? "bg-muted/10 border-border/40 opacity-60 cursor-not-allowed"
                                            : "cursor-pointer border-border hover:border-primary/30",
                                        !isDuplicate && isSelected
                                            ? "bg-[#ebf2ff] border-[#0052cc]/30"
                                            : !isDuplicate && "hover:bg-muted/10"
                                    )}
                                >
                                    {/* Monochromatic Mini Icon container */}
                                    <div className={cn(
                                        "w-9 h-9 rounded flex items-center justify-center text-base shrink-0 bg-muted/40 text-muted-foreground transition-all",
                                        isSelected && "bg-white text-primary border border-primary/20"
                                    )}>
                                        {area.icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <h4 className={cn(
                                                "text-sm font-bold tracking-tight transition-colors",
                                                isSelected ? "text-[#0052cc]" : "text-foreground"
                                            )}>
                                                {area.name}
                                            </h4>
                                            {isDuplicate && (
                                                <span className="px-2 py-0.5 rounded-sm bg-muted text-muted-foreground text-[9px] uppercase font-black tracking-widest">
                                                    Activa
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                                            {area.description}
                                        </p>
                                    </div>

                                    {/* Jira Style Checkbox */}
                                    <div className={cn(
                                        "w-5 h-5 rounded border transition-all flex items-center justify-center",
                                        isDuplicate ? "bg-muted border-border/50 text-muted-foreground/40" : (
                                            isSelected
                                                ? "bg-[#0052cc] border-[#0052cc]"
                                                : "border-border/60 group-hover:border-primary/50"
                                        )
                                    )}>
                                        {isSelected && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                                        {isDuplicate && <Check className="h-3.5 w-3.5 text-muted-foreground/30" />}
                                    </div>
                                </div>
                            );
                        })}

                        {filteredAreas.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Search className="h-8 w-8 text-muted-foreground/20 mb-3" />
                                <p className="text-sm font-bold text-muted-foreground">No se encontraron áreas</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Prueba con otro término de búsqueda</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Footer ────────────────────────────────────────────────────────── */}
                <div className="shrink-0 p-5 border-t border-border bg-white flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-[11px] font-black uppercase tracking-widest h-10 px-6 rounded-md hover:bg-muted text-muted-foreground"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={selected.length === 0 || seedMutation.isPending}
                        variant="jira"
                        className="h-10 px-8 rounded-md font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all shadow-none flex items-center gap-2"
                    >
                        {seedMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Check className="h-3.5 w-3.5" />
                        )}
                        {seedMutation.isPending ? 'Importando...' : `Importar ${selected.length} Áreas`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
