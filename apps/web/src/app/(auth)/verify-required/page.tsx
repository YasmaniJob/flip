'use client';

import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function VerifyRequiredPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

    const handleResend = async () => {
        setResending(true);
        try {
            // TODO: Implementar API endpoint para reenviar email
            // await authClient.resendVerificationEmail();
            setResent(true);
            setTimeout(() => setResent(false), 5000);
        } catch (error) {
            toast.error('No se pudo reenviar el correo');
        } finally {
            setResending(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/sign-out', { method: 'POST' });
        router.push('/login');
    };

    return (
        <div className="space-y-8">
            {/* Warning Icon */}
            <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
                <div className="w-14 h-14 bg-warning/15 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-warning-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Verifica tu email</h1>
                    {session?.user?.email && (
                        <p className="text-sm text-muted-foreground">
                            Email: <span className="font-medium text-foreground">{session.user.email}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Success message */}
            {resent && (
                <div className="p-3 rounded-xl bg-success/10 text-success text-sm font-medium text-center">
                    ✓ Email reenviado exitosamente
                </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
                <Button
                    onClick={handleResend}
                    disabled={resending || resent}
                    className="w-full h-12"
                    size="lg"
                >
                    {resending ? 'Reenviando...' : resent ? 'Email enviado' : 'Reenviar email de verificación'}
                </Button>

                <Button
                    onClick={handleLogout}
                    variant="secondary"
                    className="w-full h-12"
                    size="lg"
                >
                    Cerrar sesión
                </Button>
            </div>

            {/* Help text */}
            <div className="p-4 bg-muted rounded-xl">
                <p className="text-xs text-muted-foreground text-center">
                    ¿No recibiste el email? Revisa tu carpeta de spam. Si el problema persiste, contacta a soporte.
                </p>
            </div>
        </div>
    );
}
