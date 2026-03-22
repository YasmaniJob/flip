'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/atoms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth-client';

export default function MeetingCheckInPage() {
    const params = useParams();
    const router = useRouter();
    const meetingId = params.id as string;
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/meetings/${meetingId}/check-in`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add auth header manually if needed? 
                    // Better-auth usually handles cookies automatically if on same domain.
                    // But API is on localhost:3001 usually?
                    // The client is configured with baseURL: window.location.origin
                    // So requests go to Next.js API routes which proxy to backend?
                    // Wait, `auth-client.ts` says `baseURL: window.location.origin`. 
                    // So auth requests go to /api/auth/... on Next.js server.
                    // But other API requests go to backend?
                    // Let's assume standard fetch to /api/meetings works via proxy or direct if CORS allowed.
                    // I'll try relative path first if there is a proxy.
                },
            });
            if (!res.ok) throw new Error('Error al registrar asistencia');
            return res.json();
        },
        onSuccess: () => {
            setStatus('success');
            toast.success('Asistencia registrada correctamente');
        },
        onError: () => {
            setStatus('error');
            toast.error('Error al registrar asistencia');
        }
    });

    // Use apiClient if available?
    // Let's check api-client.ts to see how it's configured.

    if (isSessionLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!session) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-xl border-slate-200">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-black text-slate-900">Registro de Asistencia</CardTitle>
                    <CardDescription>
                        Hola <strong>{session.user.name}</strong>, confirma tu asistencia a la reunión.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 py-6">
                    {status === 'idle' && (
                        <div className="w-full space-y-4">
                            <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-100 flex gap-3">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p>Al confirmar, quedarás registrado como "Presente" en la lista oficial.</p>
                            </div>
                            <Button
                                size="lg"
                                className="w-full text-lg h-14 font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                                onClick={() => checkInMutation.mutate()}
                                disabled={checkInMutation.isPending}
                            >
                                {checkInMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Registrando...
                                    </>
                                ) : (
                                    "Confirmar Asistencia"
                                )}
                            </Button>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center animate-in zoom-in-50 duration-300">
                            <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">¡Registrado!</h3>
                            <p className="text-slate-500 text-center mb-6">Tu asistencia ha sido confirmada exitosamente.</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center animate-in zoom-in-50 duration-300">
                            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="h-10 w-10 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Error</h3>
                            <p className="text-slate-500 text-center mb-6">No se pudo registrar tu asistencia. Inténtalo de nuevo.</p>
                            <Button onClick={() => setStatus('idle')}>
                                Intentar de nuevo
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
