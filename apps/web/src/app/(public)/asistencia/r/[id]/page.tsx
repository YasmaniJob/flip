'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/atoms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, AlertCircle, QrCode, UserCheck, CalendarDays, ArrowRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';

export default function WorkshopCheckInPage() {
    const params = useParams();
    const router = useRouter();
    const reservationId = params.id as string;
    const { data: session, isPending: isSessionLoading } = useSession();
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (!isSessionLoading && !session) {
            const currentUrl = encodeURIComponent(window.location.pathname);
            router.push(`/sign-in?callbackUrl=${currentUrl}`);
        }
    }, [isSessionLoading, session, router]);

    const checkInMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/classroom-reservations/${reservationId}/attendance/check-in`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al registrar asistencia');
            return data;
        },
        onSuccess: () => {
            setStatus('success');
            toast.success('¡Asistencia confirmada!');
        },
        onError: (error: any) => {
            setStatus('error');
            toast.error(error.message || 'Error al registrar asistencia');
        }
    });

    if (isSessionLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfdfd] dark:bg-[#0a0a0a]">
                <Loader2 className="h-10 w-10 animate-spin text-primary/40 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Cargando...</p>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fdfdfd] dark:bg-[#0a0a0a] p-6 selection:bg-primary/10">
            <div className="w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Brand Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 group">
                        <QrCode className="h-8 w-8 text-primary-foreground group-hover:scale-110 transition-all" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Control de Asistencia</h1>
                        <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mt-2 italic">Registro Digital de Talleres - PIP</p>
                    </div>
                </div>

                <Card className="border-none shadow-2xl shadow-black/5 bg-card overflow-hidden rounded-[2.5rem]">
                    <CardHeader className="text-center bg-muted/5 pb-8 pt-10 px-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full mb-6">
                            <CalendarDays className="h-3 w-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Taller Activo</span>
                        </div>
                        <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight leading-none px-4 mb-3">
                            Confirmar participación
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-muted-foreground max-w-[300px] mx-auto leading-relaxed">
                            Hola <span className="text-foreground font-black underline decoration-primary/40 underline-offset-4">{session.user.name.split(' ')[0]}</span>, pulsa el botón para añadirte al registro oficial de este taller.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-10 pt-4 flex flex-col items-center">
                        {status === 'idle' && (
                            <div className="w-full space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-5 bg-muted/30 rounded-3xl border border-border group hover:bg-muted/50 transition-all cursor-default">
                                        <div className="h-12 w-12 bg-card rounded-2xl flex items-center justify-center border border-border group-hover:border-primary/20 transition-all">
                                            <UserCheck className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Usuario</span>
                                            <span className="text-sm font-black text-foreground truncate max-w-[200px] uppercase tracking-tight">{session.user.name}</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    size="lg"
                                    className="w-full text-[10px] uppercase tracking-[0.2em] h-16 font-black rounded-3xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all gap-4 group"
                                    onClick={() => checkInMutation.mutate()}
                                    disabled={checkInMutation.isPending}
                                >
                                    {checkInMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            Procesando registro...
                                        </>
                                    ) : (
                                        <>
                                            Confirmar mi asistencia
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="flex flex-col items-center animate-in zoom-in-90 duration-500 py-4">
                                <div className="h-24 w-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/30">
                                    <CheckCircle2 className="h-12 w-12 text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-foreground mb-3 uppercase tracking-tight">¡REGISTRO EXITOSO!</h3>
                                <p className="text-sm font-medium text-muted-foreground text-center mb-10 max-w-[240px]">Tu participación ha sido guardada en el acta digital del taller.</p>
                                
                                <Button 
                                    variant="outline" 
                                    className="rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest gap-3"
                                    onClick={() => router.push('/reservaciones')}
                                >
                                    Ir a mis reservas
                                    <ArrowRight className="h-3 w-3" />
                                </Button>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="flex flex-col items-center animate-in zoom-in-95 duration-300 py-4 text-center">
                                <div className="h-24 w-24 bg-red-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-red-500/30">
                                    <AlertCircle className="h-12 w-12 text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-foreground mb-3 uppercase tracking-tight">ERROR AL REGISTRAR</h3>
                                <p className="text-sm font-medium text-muted-foreground text-center mb-10 max-w-[280px]">
                                    No pudimos completar tu registro. Asegúrate de estar asignado a esta institución.
                                </p>
                                <Button 
                                    variant="outline" 
                                    className="rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest"
                                    onClick={() => setStatus('idle')}
                                >
                                    Reintentar ahora
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <p className="text-[10px] text-center font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">
                    FLIP INNOVACIÓN • SISTEMA DE GESTIÓN EDUCATIVA
                </p>
            </div>
        </div>
    );
}
