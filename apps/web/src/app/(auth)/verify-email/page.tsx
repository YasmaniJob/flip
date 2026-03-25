'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const token = searchParams.get('token');

    useEffect(() => {
        async function verify() {
            if (!token) {
                setStatus('error');
                setErrorMessage('Link de verificación inválido');
                return;
            }

            try {
                await authClient.verifyEmail({ query: { token } });
                setStatus('success');

                // Redirigir al inventario después de 2 segundos
                setTimeout(() => {
                    router.push('/inventario');
                }, 2000);
            } catch (error: any) {
                setStatus('error');
                setErrorMessage(error.message || 'Error al verificar email');
            }
        }

        verify();
    }, [token, router]);

    return (
        <div className="space-y-8">
            {status === 'loading' && (
                <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
                    <div className="relative w-14 h-14">
                        <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">Verificando email...</h1>
                        <p className="text-muted-foreground">Por favor espera un momento</p>
                    </div>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
                    <div className="w-14 h-14 bg-success/15 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">¡Email verificado!</h1>
                        <p className="text-muted-foreground">Tu cuenta ha sido activada correctamente.</p>
                        <p className="text-sm text-muted-foreground">Redirigiendo al dashboard...</p>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
                    <div className="w-14 h-14 bg-destructive/15 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">Error de verificación</h1>
                        <p className="text-muted-foreground">{errorMessage}</p>
                    </div>

                    <Button
                        onClick={() => router.push('/login')}
                        variant="default"
                        className="mt-2"
                    >
                        Volver al inicio de sesión
                    </Button>
                </div>
            )}
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Cargando...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
