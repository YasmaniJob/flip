import { useState, useEffect } from 'react';
import { Resource } from '../../types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/atoms/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DamageReportFormProps {
    resource: Resource;
    initialData?: any;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onReportChange: (report: any) => void;
}

const PROBLEM_CATEGORIES: Record<string, string[]> = {
    // Computación y Laptops
    'Laptop': ["Pantalla rota/rayada", "Teclas faltantes", "Batería no carga", "Touchpad no responde", "Bisagras rotas"],
    'Tablet': ["Pantalla rota/rayada", "Puerto carga dañado", "Botones atascados", "Batería hinchada"],
    'Computadora': ["No enciende", "Ruidos extraños", "Puertos USB dañados", "Se reinicia sola"],

    // Periféricos y Accesorios
    'Mouse': ["Click no responde", "Sensor falla", "Cable dañado", "Rueda atascada"],
    'Teclado': ["Teclas no funcionan", "Cable dañado", "Patas rotas"],
    'Audífonos': ["Cable roto", "Solo se escucha un lado", "Almohadillas rotas"],
    'Cargador': ["Cable pelado", "No carga", "Conector doblado"],

    // Componentes y Otros
    'Disco Duro': ["No reconocido", "Sectores dañados", "Ruidos mecánicos"],
    'Memoria RAM': ["Pantallazo azul", "No reconocida"],
    'Robótica': ["Piezas faltantes", "Motor quemado", "Sensores dañados", "Cables sueltos"],

    // Default
    'General': ["Golpes visibles", "Suciedad excesiva", "No funciona", "Desgaste inusual"]
};

const getProblemsForResource = (resource: Resource) => {
    // Try to match specific category name
    const categoryName = resource.category?.name || '';

    // Check direct match or includes
    const match = Object.keys(PROBLEM_CATEGORIES).find(key =>
        categoryName.toLowerCase().includes(key.toLowerCase())
    );

    const specificProblems = match ? PROBLEM_CATEGORIES[match] : [];
    const generalProblems = PROBLEM_CATEGORIES['General'];

    // Merge specific + general (preventing duplicates if any)
    return Array.from(new Set([...specificProblems, ...generalProblems]));
};

export function DamageReportForm({ resource, initialData, isExpanded, onToggleExpand, onReportChange }: DamageReportFormProps) {
    const formattedId = (resource.internalId || '').split('-').pop()?.replace(/^0+/, '').padStart(2, '0') || resource.internalId || '';
    const [problems, setProblems] = useState<string[]>(initialData?.commonProblems || []);
    const [notes, setNotes] = useState(initialData?.otherNotes || "");

    const availableProblems = getProblemsForResource(resource);
    const hasReport = problems.length > 0 || notes.length > 0;

    // Notify parent on change
    useEffect(() => {
        if (problems.length > 0 || notes) {
            onReportChange({ commonProblems: problems, otherNotes: notes });
        } else {
            onReportChange(null);
        }
    }, [problems, notes]);

    const toggleProblem = (problem: string) => {
        setProblems(prev =>
            prev.includes(problem)
                ? prev.filter(p => p !== problem)
                : [...prev, problem]
        );
    };

    return (
        <div className={cn(
            "bg-card rounded-md border transition-colors duration-200 overflow-hidden",
            hasReport ? "border-destructive bg-destructive/5" : "border-border"
        )}>
            {/* Header / Summary Row */}
            <div
                className={cn(
                    "p-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors",
                    isExpanded && "bg-muted/10 border-b border-border"
                )}
                onClick={onToggleExpand}
            >
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="font-medium text-sm text-slate-900">{resource.name}</span>
                        <span className="text-xs text-muted-foreground">{formattedId}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {hasReport && (
                        <Badge variant="destructive" className="h-6 px-2 text-[10px] gap-1 uppercase tracking-widest rounded-sm">
                            <AlertTriangle className="w-3 h-3" />
                            Reportado
                        </Badge>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Expanded Form */}
            {isExpanded && (
                <div className="p-4 space-y-4 bg-card animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Problemas Comunes</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {availableProblems.map(problem => {
                                const isSelected = problems.includes(problem);
                                return (
                                    <div
                                        key={problem}
                                        onClick={() => toggleProblem(problem)}
                                        className={cn(
                                            "flex items-center justify-center text-center p-2 rounded-md border text-xs font-bold uppercase tracking-wide cursor-pointer transition-colors select-none",
                                            isSelected
                                                ? "bg-destructive text-destructive-foreground border-destructive"
                                                : "bg-card border-border text-muted-foreground hover:border-foreground/20 hover:bg-muted/30"
                                        )}
                                    >
                                        {problem}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalles Adicionales</Label>
                        <Textarea
                            placeholder="Describe el daño específicamente..."
                            className="h-20 text-sm bg-background resize-none border-border focus:border-destructive focus:ring-1 focus:ring-destructive"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
