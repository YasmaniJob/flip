'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Institution {
    id: string;
    name: string;
    nivel?: string;
}

interface InstitutionSelectorModalProps {
    open: boolean;
    institutions: Institution[];
    onSelect: (institutionId: string) => Promise<void>;
    isLoading?: boolean;
}

export function InstitutionSelectorModal({
    open,
    institutions,
    onSelect,
    isLoading = false,
}: InstitutionSelectorModalProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleSelect = async (institutionId: string) => {
        setSelectedId(institutionId);
        await onSelect(institutionId);
    };

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-[600px] shadow-none border border-border" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground">
                        Selecciona tu Institución
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Detectamos que trabajas en múltiples instituciones. Por favor, selecciona la institución con la que deseas iniciar sesión.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-3 mt-6">
                    {institutions.map((institution) => (
                        <button
                            key={institution.id}
                            onClick={() => handleSelect(institution.id)}
                            disabled={isLoading}
                            className={cn(
                                "relative flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left",
                                "hover:border-primary/50 hover:bg-primary/5",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                selectedId === institution.id
                                    ? "border-primary bg-primary/10"
                                    : "border-border bg-card/40"
                            )}
                        >
                            <div className="w-12 h-12 rounded-lg bg-white border border-border flex items-center justify-center text-primary shadow-none shrink-0">
                                <Building2 className="h-6 w-6" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-sm uppercase tracking-tight text-foreground truncate">
                                    {institution.name}
                                </h3>
                                {institution.nivel && (
                                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                                        {institution.nivel}
                                    </p>
                                )}
                            </div>

                            {selectedId === institution.id && isLoading && (
                                <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                        <span className="font-black uppercase tracking-widest">Nota:</span> Podrás cambiar de institución más tarde desde la configuración de tu perfil.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
