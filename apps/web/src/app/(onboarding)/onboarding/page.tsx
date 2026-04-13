"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, ArrowRight } from "lucide-react";

import { OnboardingData, Step, STEPS, STEP_META } from "./components/types";
import { StepIndicator } from "./components/StepIndicator";
import { StepNivel } from "./components/StepNivel";
import { StepInstitucion } from "./components/StepInstitucion";
import { StepConfirmacion } from "./components/StepConfirmacion";
import { OnboardingOverlay } from "./components/OnboardingOverlay";

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, isPending } = useSession();

    const [step, setStep] = useState<Step>('nivel');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState<OnboardingData>({ nivel: null, institution: null });

    const isChanging = searchParams.get('change') === 'true';

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/login");
        }
    }, [session, isPending, router]);

    const updateData = (updates: Partial<OnboardingData>) => {
        setData(prev => ({ ...prev, ...updates }));
    };

    const handleSubmit = async () => {
        if (!data.institution || !data.nivel) return;
        setError("");
        setIsLoading(true);

        try {
            const body: any = {
                codigoModular: data.institution.codigoModular,
                nivel: data.nivel,
                isManual: data.isManual
            };

            if (data.isManual) {
                body.nombre = data.institution.nombre;
                body.departamento = data.institution.departamento;
                body.provincia = data.institution.provincia;
                body.distrito = data.institution.distrito;
            }

            const response = await fetch('/api/institutions/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error('Error al completar onboarding');

            const result = await response.json();

            // If backend requires re-authentication (session was invalidated)
            if (result.requiresReauth) {
                // Force logout and redirect to login
                const { authClient } = await import('@/lib/auth-client');
                await authClient.signOut();
                window.location.href = '/login?message=onboarding_complete';
                return;
            }

            const { authClient } = await import('@/lib/auth-client');
            await authClient.getSession();

            // Esperar a que la sesión tenga institutionId
            let retries = 0;
            while (retries < 10) {
                const session = await authClient.getSession();
                if ((session?.data?.user as any)?.institutionId) break;
                await new Promise(r => setTimeout(r, 300));
                retries++;
            }

            await authClient.getSession();
            // Forzar refresh de la sesión en Better Auth
            const freshSession = await authClient.getSession();
            if ((freshSession?.data?.user as any)?.institutionId) {
                window.location.replace('/dashboard');
            } else {
                // Si aún no tiene institutionId, esperar 2 segundo más
                await new Promise(r => setTimeout(r, 2000));
                window.location.replace('/dashboard');
            }

        } catch (err) {
            console.error(err);
            setError("Error al guardar información. Intenta de nuevo.");
            setIsLoading(false);
        }
    };

    const nextStep = () => {
        const idx = STEPS.indexOf(step);
        if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
    };

    const prevStep = () => {
        const idx = STEPS.indexOf(step);
        if (idx > 0) {
            const previousStep = STEPS[idx - 1];
            if (previousStep === 'institucion') updateData({ institution: null });
            setStep(previousStep);
        }
    };

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/40">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    const user = session?.user as any;
    const isSuperAdmin = user?.isSuperAdmin;

    if (user?.institutionId && !isChanging && !isLoading) {
        if (typeof window !== 'undefined') window.location.href = '/dashboard';
        return null;
    }

    const meta = STEP_META[step];

    const renderNavButtons = (isMobile: boolean) => (
        <>
            <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
                {step !== 'nivel' && (
                    <button
                        onClick={prevStep}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40"
                    >
                        Atrás
                    </button>
                )}
                {isChanging && (
                    <button
                        onClick={() => router.push('/settings')}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40"
                    >
                        Cancelar
                    </button>
                )}
            </div>

            <div>
                {step === 'nivel' ? (
                    <button
                        onClick={nextStep}
                        disabled={!data.nivel || isLoading}
                        className="w-full sm:w-auto group flex items-center justify-center gap-2 px-10 py-3.5 rounded-lg bg-primary text-primary-foreground text-base font-bold hover:bg-primary/90 transition-all disabled:opacity-40 active:scale-95 border border-primary"
                    >
                        Continuar
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                ) : step !== 'confirmacion' ? (
                    <button
                        onClick={nextStep}
                        disabled={step === 'institucion' && !data.institution}
                        className={`${isMobile ? 'h-11 px-10' : 'px-8 py-2.5'} rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-sm`}
                    >
                        {step === 'institucion' && data.institution ? 'Confirmar selección' : 'Siguiente'}
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className={`${isMobile ? 'px-6 min-w-[140px]' : 'px-8 min-w-[160px]'} py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center`}
                    >
                        {isLoading ? (
                            <>
                                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                {isChanging ? 'Cambiando...' : 'Configurando...'}
                            </>
                        ) : isChanging ? 'Confirmar cambio' : 'Ir a mi espacio'}
                    </button>
                )}
            </div>
        </>
    );

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground animate-in fade-in duration-500 relative">
            {isLoading && <OnboardingOverlay />}

            <header className="h-16 border-b border-border flex items-center px-6 lg:px-12 justify-between shrink-0 bg-background z-20 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center">
                        <span className="text-sm font-black">F</span>
                    </div>
                    <span className="font-semibold tracking-tight text-foreground">Flip Setup</span>
                </div>
                <div className="flex items-center gap-4">
                    <StepIndicator currentStep={step} />
                    <div className="h-4 w-px bg-border mx-2"></div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex flex-col flex-1 max-w-[1400px] mx-auto w-full px-6 py-4 lg:py-8 pb-24 lg:pb-8 lg:justify-center min-h-0">
                <div className={`${step === 'nivel' ? 'mb-8' : 'mb-6'} text-center mx-auto max-w-4xl px-4 shrink-0`}>
                    {data.nivel && step !== 'nivel' && step !== 'confirmacion' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.15em]"
                        >
                            {data.nivel === 'primaria' ? <BookOpen size={14} /> : <GraduationCap size={14} />}
                            Nivel {data.nivel}
                        </motion.div>
                    )}
                    <h1 className={`${step === 'nivel' ? 'text-4xl' : 'text-3xl'} font-bold text-foreground tracking-tight ${meta.subtitle ? 'mb-4' : 'mb-0'} transition-all duration-500`}>
                        {meta.title}
                    </h1>
                    {meta.subtitle && (
                        <p className="text-xl text-muted-foreground/80 font-medium transition-all duration-500 max-w-xl mx-auto leading-relaxed mt-2">
                            {meta.subtitle}
                        </p>
                    )}
                </div>

                {isSuperAdmin && step === 'nivel' && (
                    <div className="mb-6 inline-flex items-center gap-3 p-3 rounded-md bg-muted border border-border text-sm max-w-fit mx-auto">
                        <span className="text-lg">👑</span>
                        <p className="font-medium text-foreground">
                            Vincular institución es opcional para super admins.
                        </p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="text-xs font-semibold text-primary hover:underline ml-2"
                        >
                            Omitir setup →
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-2 items-start max-w-3xl mx-auto w-full">
                        <span className="mt-0.5">⚠️</span> {error}
                    </div>
                )}

                <div className="mb-0">
                    {step === 'nivel' && <StepNivel data={data} updateData={updateData} />}
                    {step === 'institucion' && <StepInstitucion data={data} updateData={updateData} />}
                    {step === 'confirmacion' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto w-full">
                            <div className="bg-[#f4f5f7] dark:bg-muted/20 p-6 md:p-8 rounded-2xl border border-border/50">
                                <StepConfirmacion data={data} isChanging={isChanging} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Spacer for desktop layout */}
                <div className="hidden lg:block">
                    <div className={`transition-all duration-500 flex items-center w-full mx-auto ${step === 'institucion' ? 'max-w-6xl' : 'max-w-3xl'} ${step === 'nivel' ? 'justify-center border-none pt-0 mt-8' : 'justify-between pt-6 border-t border-border/50 mt-4'}`}>
                        {renderNavButtons(false)}
                    </div>
                </div>
            </main>
            {/* MOBILE FIXED BOTTOM NAV */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border px-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] flex items-center">
                {step === 'nivel' ? (
                    <button
                        onClick={nextStep}
                        disabled={!data.nivel || isLoading}
                        className="w-full group flex items-center justify-center gap-2 py-4 rounded-lg bg-primary text-primary-foreground text-base font-bold hover:bg-primary/90 transition-all disabled:opacity-40 active:scale-95 border border-primary"
                    >
                        Continuar
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                ) : (
                    <div className="flex items-center justify-between w-full gap-3">
                        {renderNavButtons(true)}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={null}>
            <OnboardingContent />
        </Suspense>
    );
}
