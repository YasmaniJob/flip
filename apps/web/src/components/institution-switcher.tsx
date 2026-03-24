'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { Building2, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface Institution {
    id: string;
    name: string;
    nivel?: string;
    logo?: string;
}

interface MyInstitutionsResponse {
    institutions: Institution[];
    activeInstitutionId: string;
}

export function InstitutionSwitcher() {
    const { data: session } = useSession();
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [activeInstitutionId, setActiveInstitutionId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSwitching, setIsSwitching] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (session?.user) {
            fetchInstitutions();
        }
    }, [session]);

    const fetchInstitutions = async () => {
        try {
            const res = await fetch('/api/users/my-institutions');
            if (res.ok) {
                const data: MyInstitutionsResponse = await res.json();
                setInstitutions(data.institutions);
                setActiveInstitutionId(data.activeInstitutionId);
            }
        } catch (error) {
            console.error('Error fetching institutions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwitchInstitution = async (institutionId: string) => {
        if (institutionId === activeInstitutionId || isSwitching) return;

        setIsSwitching(true);
        setOpen(false);

        try {
            const res = await fetch('/api/auth/set-active-institution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ institutionId }),
            });

            if (res.ok) {
                // Sincronizar con localStorage
                localStorage.setItem('flip_last_institution_id', institutionId);
                
                // Delay para asegurar que la BD se actualice antes de recargar
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Recargar la página para actualizar toda la data
                window.location.href = '/dashboard';
            } else {
                const data = await res.json();
                console.error('Error switching institution:', data.error);
                setIsSwitching(false);
            }
        } catch (error) {
            console.error('Error switching institution:', error);
            setIsSwitching(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs font-medium">Cargando...</span>
            </div>
        );
    }

    // Si solo tiene una institución, no mostrar el switcher
    if (institutions.length <= 1) {
        return null;
    }

    const activeInstitution = institutions.find((i) => i.id === activeInstitutionId);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-between px-3 py-2 h-auto hover:bg-muted/50 transition-colors",
                        isSwitching && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={isSwitching}
                >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-md bg-card border border-border flex items-center justify-center text-primary shrink-0">
                            <Building2 className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-start min-w-0 flex-1">
                            <span className="text-xs font-black uppercase tracking-tight text-foreground truncate w-full text-left">
                                {activeInstitution?.name || 'Institución'}
                            </span>
                            {activeInstitution?.nivel && (
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                    {activeInstitution.nivel}
                                </span>
                            )}
                        </div>
                    </div>
                    {isSwitching ? (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0 ml-2" />
                    ) : (
                        <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[280px] p-0">
                <div className="p-2">
                    <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Cambiar Institución
                    </div>
                    <div className="border-t border-border my-1" />
                    <div className="space-y-1">
                        {institutions.map((institution) => (
                            <button
                                key={institution.id}
                                onClick={() => handleSwitchInstitution(institution.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors hover:bg-muted/50",
                                    institution.id === activeInstitutionId && "bg-muted/50"
                                )}
                            >
                                <div className="w-8 h-8 rounded-md bg-card border border-border flex items-center justify-center text-primary shrink-0">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col items-start min-w-0 flex-1">
                                    <span className="text-xs font-black uppercase tracking-tight text-foreground truncate w-full text-left">
                                        {institution.name}
                                    </span>
                                    {institution.nivel && (
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                            {institution.nivel}
                                        </span>
                                    )}
                                </div>
                                {institution.id === activeInstitutionId && (
                                    <Check className="h-4 w-4 text-primary shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
