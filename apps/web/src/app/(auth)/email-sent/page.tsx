'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';

function EmailSentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || 'tu email';
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

    const handleResend = async () => {
        setResending(true);
        try {
            const response = await fetch('/api/auth/send-verification-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setResent(true);
                setTimeout(() => setResent(false), 5000);
            } else {
                console.error('Error al reenviar email');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Icon */}
            <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Revisa tu email</h1>
                    <p className="text-muted-foreground">
                        Te enviamos un link de verificación. Haz click en el link para activar tu cuenta.
                    </p>
                    <p className="font-medium text-foreground">{email}</p>
                </div>
            </div>

            <div className="grid gap-6">
                <div className="flex flex-col gap-4">
                    <Button
                        variant="default"
                        size="lg"
                        className="w-full"
                        onClick={() => window.open('https://gmail.com', '_blank')}
                    >
                        Abrir Gmail
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full"
                        onClick={() => window.open('https://outlook.com', '_blank')}
                    >
                        Abrir Outlook
                    </Button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            ¿No recibiste el email?
                        </span>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    className="w-full"
                    onClick={handleResend}
                    disabled={resending || resent}
                >
                    {resending ? 'Enviando...' : resent ? '¡Email reenviado!' : 'Reenviar email de verificación'}
                </Button>

                <Button
                    variant="link"
                    className="w-full text-muted-foreground"
                    onClick={() => router.push('/login')}
                >
                    Volver al inicio de sesión
                </Button>
            </div>
        </div>
    );
}

export default function EmailSentPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando...</div>}>
            <EmailSentContent />
        </Suspense>
    );
}
