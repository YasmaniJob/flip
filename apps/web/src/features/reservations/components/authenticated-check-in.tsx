'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import { CheckCircle2, Loader2, ArrowRight, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AuthenticatedCheckInProps {
    reservationId: string;
    userName: string;
}

export function AuthenticatedCheckIn({ reservationId, userName }: AuthenticatedCheckInProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();

    async function handleCheckIn() {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/classroom-reservations/${reservationId}/attendance/check-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al registrar asistencia');
            }

            setIsSuccess(true);
            toast.success('¡Asistencia confirmada!');
        } catch (error) {
            toast.error('Error', {
                description: error instanceof Error ? error.message : 'No se pudo registrar la asistencia'
            });
        } finally {
            setIsLoading(false);
        }
    }

    if (isSuccess) {
        return (
            <div className="w-full max-w-md mx-auto animate-in zoom-in-95 duration-500">
                <div className="bg-card border-2 border-emerald-500/20 rounded-sm p-10 text-center space-y-8">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </div>
                    
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
                            ¡Asistencia Confirmada!
                        </h2>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
                            Gracias por participar, {userName.split(' ')[0]}
                        </p>
                    </div>

                    <Button 
                        onClick={() => router.push('/reservaciones')}
                        variant="outline" 
                        className="w-full h-12 text-[10px] font-black uppercase tracking-widest border-border hover:bg-primary hover:text-white transition-all"
                    >
                        Volver a mis reservas
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-card border border-border/50 rounded-sm p-10 text-center space-y-8">
                <div className="space-y-2">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <UserCheck className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Hola, {userName.split(' ')[0]}</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ya estás logueado en BeeClass</p>
                </div>

                <div className="p-6 bg-muted/20 border border-border rounded-sm">
                    <p className="text-[10px] font-bold text-foreground uppercase tracking-widest leading-relaxed">
                        Solo pulsa el botón de abajo para registrar tu entrada oficial a este taller.
                    </p>
                </div>

                <Button
                    onClick={handleCheckIn}
                    disabled={isLoading}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-[0.2em] rounded-sm transition-all group"
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <span className="flex items-center gap-3">
                            Confirmar mi Asistencia
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1" />
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
}
