
import { useState, useEffect } from 'react';
import { Resource } from '../../types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/atoms/textarea';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestionFormProps {
    resource: Resource;
    initialData?: any;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onReportChange: (report: any) => void;
}

const COMMON_SUGGESTIONS = [
    "Limpieza necesaria",
    "Actualizar software",
    "Batería dura poco",
    "Falta accesorio no crítico"
];

export function SuggestionForm({ resource, initialData, isExpanded, onToggleExpand, onReportChange }: SuggestionFormProps) {
    const formattedId = (resource.internalId || '').split('-').pop()?.replace(/^0+/, '').padStart(2, '0') || resource.internalId || '';
    const [suggestions, setSuggestions] = useState<string[]>(initialData?.commonSuggestions || []);
    const [notes, setNotes] = useState(initialData?.otherNotes || "");

    const hasReport = suggestions.length > 0 || notes.length > 0;

    useEffect(() => {
        if (suggestions.length > 0 || notes) {
            onReportChange({ commonSuggestions: suggestions, otherNotes: notes });
        } else {
            onReportChange(null);
        }
    }, [suggestions, notes]);

    const toggleSuggestion = (suggestion: string) => {
        setSuggestions(prev =>
            prev.includes(suggestion)
                ? prev.filter(s => s !== suggestion)
                : [...prev, suggestion]
        );
    };

    return (
        <div className={cn(
            "bg-card rounded-md border transition-colors duration-200 overflow-hidden",
            hasReport ? "border-primary/50 bg-primary/5" : "border-border"
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
                        <Badge variant="outline" className="h-6 px-2 text-[10px] gap-1 border-primary/50 text-foreground uppercase tracking-widest font-bold bg-primary/10 rounded-sm">
                            <Lightbulb className="w-3 h-3 text-primary" />
                            Sugerencia
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
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sugerencias Comunes</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {COMMON_SUGGESTIONS.map(s => {
                                const isSelected = suggestions.includes(s);
                                return (
                                    <div
                                        key={s}
                                        onClick={() => toggleSuggestion(s)}
                                        className={cn(
                                            "flex items-center justify-center text-center p-2 rounded-md border text-xs font-bold uppercase tracking-wide cursor-pointer transition-colors select-none",
                                            isSelected
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-card border-border text-muted-foreground hover:border-foreground/20 hover:bg-muted/30"
                                        )}
                                    >
                                        {s}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comentarios Adicionales</Label>
                        <Textarea
                            placeholder="Sugerencias para mejorar el recurso..."
                            className="h-20 text-sm bg-background resize-none border-border focus:border-primary focus:ring-1 focus:ring-primary"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
