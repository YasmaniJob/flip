"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, GraduationCap, Info } from "lucide-react";
import { useState } from "react";
import { sileo } from "sileo";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { SocialAuth } from "@/components/auth/SocialAuth";
import { loginSchema, LoginValues } from "@/lib/auth-schemas";
import { useAuthBranding } from "@/lib/use-auth-branding";
import { InstitutionSelectorModal } from "@/components/auth/institution-selector-modal";

interface Institution {
    id: string;
    name: string;
    nivel?: string;
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const { brand, institutionName, logoUrl } = useAuthBranding();
    
    // Detectar si viene por sesión expirada
    const sessionExpired = searchParams.get('session_expired') === 'true';
    const roleChanged = searchParams.get('role_changed') === 'true';
    
    // Estado para el modal de selección de institución
    const [showInstitutionSelector, setShowInstitutionSelector] = useState(false);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [pendingCredentials, setPendingCredentials] = useState<{ email: string; dni: string } | null>(null);
    const [isSelectingInstitution, setIsSelectingInstitution] = useState(false);

    const subtitle = institutionName 
        ? `Bienvenido a ${institutionName}` 
        : "Sistema de Gestión y Préstamos";

    // Mostrar mensaje de sesión expirada
    useEffect(() => {
        if (sessionExpired || roleChanged) {
            sileo.info({
                title: roleChanged ? "Tu rol ha cambiado" : "Sesión expirada",
                description: roleChanged 
                    ? "Un administrador actualizó tu rol. Por favor, inicia sesión nuevamente para ver los cambios."
                    : "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
                fill: "#dbeafe",
                styles: {
                    title: "!text-blue-900 font-bold",
                    description: "!text-blue-800 font-medium",
                    badge: "!bg-blue-500 !text-white"
                }
            });
        }
    }, [sessionExpired, roleChanged]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const handleInstitutionSelect = async (institutionId: string) => {
        if (!pendingCredentials) return;

        setIsSelectingInstitution(true);

        try {
            const lazyRegisterRes = await fetch("/api/auth/lazy-register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: pendingCredentials.email,
                    dni: pendingCredentials.dni,
                    selectedInstitutionId: institutionId,
                }),
            });

            const lazyRegisterData = await lazyRegisterRes.json();

            if (lazyRegisterRes.ok && lazyRegisterData.success) {
                if (lazyRegisterData.user?.institutionId) {
                    localStorage.setItem("flip:last-institution-id", lazyRegisterData.user.institutionId);
                }
                
                // Guardar preferencia de institución seleccionada
                localStorage.setItem('flip_last_institution_id', institutionId);
                
                sileo.success({
                    title: "¡Bienvenido!",
                    description: "Acceso verificado correctamente.",
                    fill: "#dcfce7",
                    styles: {
                        title: "!text-green-900 font-bold",
                        description: "!text-green-800 font-medium",
                        badge: "!bg-green-500 !text-white"
                    }
                });
                
                await new Promise(resolve => setTimeout(resolve, 100));
                window.location.href = lazyRegisterData.redirectTo || "/dashboard";
            } else {
                setIsSelectingInstitution(false);
                setShowInstitutionSelector(false);
                
                sileo.error({
                    title: "Error al seleccionar institución",
                    description: lazyRegisterData.error || "No se pudo completar el acceso.",
                    fill: "#fee2e2",
                    styles: {
                        title: "!text-red-900 font-bold",
                        description: "!text-red-800 font-medium",
                        badge: "!bg-red-500 !text-white"
                    }
                });
            }
        } catch (error) {
            setIsSelectingInstitution(false);
            setShowInstitutionSelector(false);
            
            sileo.error({
                title: "Error de conexión",
                description: "No se pudo completar la selección. Intenta nuevamente.",
                fill: "#fee2e2",
                styles: {
                    title: "!text-red-900 font-bold",
                    description: "!text-red-800 font-medium",
                    badge: "!bg-red-500 !text-white"
                }
            });
        }
    };

    const onSubmit = (values: LoginValues) => {
        startTransition(async () => {
            try {
                // Intentar login normal
                const result = await signIn.email({
                    email: values.email,
                    password: values.password,
                });

                if (result.error) {
                    // Si falla, intentar lazy registration (DNI como contraseña)
                    try {
                        // Leer preferencia de institución guardada
                        const savedInstitutionId = localStorage.getItem('flip_last_institution_id');
                        
                        const lazyRegisterRes = await fetch("/api/auth/lazy-register", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                email: values.email,
                                dni: values.password,
                                selectedInstitutionId: savedInstitutionId || undefined,
                            }),
                        });

                        const lazyRegisterData = await lazyRegisterRes.json();

                        // Manejar caso de múltiples instituciones
                        if (lazyRegisterData.requiresSelection) {
                            setPendingCredentials({
                                email: values.email,
                                dni: values.password,
                            });
                            setInstitutions(lazyRegisterData.institutions || []);
                            setShowInstitutionSelector(true);
                            return;
                        }

                        // Si solo hay una institución, proceder normalmente
                        if (lazyRegisterRes.ok && lazyRegisterData.success) {
                            // La sesión ya está creada por el endpoint
                            if (lazyRegisterData.user?.institutionId) {
                                localStorage.setItem("flip:last-institution-id", lazyRegisterData.user.institutionId);
                            }
                            
                            sileo.success({
                                title: "¡Bienvenido!",
                                description: "Acceso verificado correctamente.",
                                fill: "#dcfce7",
                                styles: {
                                    title: "!text-green-900 font-bold",
                                    description: "!text-green-800 font-medium",
                                    badge: "!bg-green-500 !text-white"
                                }
                            });
                            
                            // Pequeño delay para asegurar que la cookie se procese
                            await new Promise(resolve => setTimeout(resolve, 100));
                            
                            // Redirección dura para forzar recarga completa y evitar caché
                            window.location.href = lazyRegisterData.redirectTo || "/dashboard";
                            return;
                        }

                        // Si lazy register falló, mostrar el mensaje específico
                        if (lazyRegisterRes.status === 404) {
                            sileo.error({
                                title: "Acceso no autorizado",
                                description: lazyRegisterData.error || "No se encontró un registro de personal con ese correo y DNI.",
                                fill: "#fee2e2",
                                styles: {
                                    title: "!text-red-900 font-bold",
                                    description: "!text-red-800 font-medium",
                                    badge: "!bg-red-500 !text-white"
                                }
                            });
                        } else if (lazyRegisterRes.status === 409) {
                            sileo.error({
                                title: "Contraseña incorrecta",
                                description: "Ya tienes una cuenta. Usa tu contraseña (no tu DNI) para iniciar sesión.",
                                fill: "#fef3c7",
                                styles: {
                                    title: "!text-yellow-900 font-bold",
                                    description: "!text-yellow-800 font-medium",
                                    badge: "!bg-yellow-500 !text-white"
                                }
                            });
                        } else {
                            sileo.error({
                                title: "No pudimos iniciar sesión",
                                description: lazyRegisterData.error || "Las credenciales no coinciden. Por favor, revisa tu correo y contraseña e intenta de nuevo.",
                                fill: "#fee2e2",
                                styles: {
                                    title: "!text-red-900 font-bold",
                                    description: "!text-red-800 font-medium",
                                    badge: "!bg-red-500 !text-white"
                                }
                            });
                        }
                    } catch (lazyRegisterError) {
                        // Si lazy register falla por error de red, mostrar error genérico
                        sileo.error({
                            title: "No pudimos iniciar sesión",
                            description: "Las credenciales no coinciden. Por favor, revisa tu correo y contraseña e intenta de nuevo.",
                            fill: "#fee2e2",
                            styles: {
                                title: "!text-red-900 font-bold",
                                description: "!text-red-800 font-medium",
                                badge: "!bg-red-500 !text-white"
                            }
                        });
                    }
                } else {
                    const sessionRes = await fetch("/api/auth/get-session");
                    const sessionData = await sessionRes.json();
                    if (sessionData?.user?.institutionId) {
                        localStorage.setItem("flip:last-institution-id", sessionData.user.institutionId);
                    }
                    router.push("/dashboard");
                }
            } catch (err) {
                sileo.error({
                    title: "Problema de conexión",
                    description: "Revisa tu conexión a internet o intenta de nuevo en unos minutos.",
                    fill: "#fff7ed",
                    styles: {
                        title: "!text-orange-900 font-bold",
                        description: "!text-orange-800 font-medium",
                        badge: "!bg-orange-500 !text-white"
                    }
                });
            }
        });
    };

    return (
        <div className="bg-background border border-border/30 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[400px] w-full rounded-lg relative z-10 font-sans">

            {/* Banner de información cuando viene por cambio de rol */}
            {(sessionExpired || roleChanged) && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">
                                {roleChanged ? "Tu rol ha cambiado" : "Sesión expirada"}
                            </h3>
                            <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                                {roleChanged 
                                    ? "Un administrador actualizó tu rol. Inicia sesión para ver tus nuevos permisos."
                                    : "Por seguridad, tu sesión ha expirado. Por favor, inicia sesión nuevamente."
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <AuthHeader 
                title="Flip"
                subtitle={subtitle}
                logoUrl={logoUrl}
                brandColor={brand}
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label
                        htmlFor="email"
                        className="text-[12px] font-bold text-foreground"
                    >
                        Correo electrónico
                    </label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        {...register("email")}
                        disabled={isPending}
                        style={{ borderColor: errors.email ? undefined : brand }}
                        className={`border-2 shadow-none rounded-[3px] h-10 px-3 bg-background text-sm focus-visible:ring-1 outline-none transition-all placeholder:font-medium placeholder:text-muted-foreground/40 ${errors.email ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20" : "border-border/60"
                            }`}
                    />
                    {errors.email && (
                        <p className="text-[11px] font-bold text-destructive mt-1">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label
                            htmlFor="password"
                            className="text-[12px] font-bold text-foreground"
                        >
                            Contraseña
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-[12px] font-bold hover:underline"
                            style={{ color: brand }}
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>

                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...register("password")}
                            disabled={isPending}
                            style={{ borderColor: errors.password ? undefined : brand }}
                            className={`border-2 shadow-none rounded-[3px] h-10 pl-3 pr-10 bg-background text-sm focus-visible:ring-1 outline-none transition-all placeholder:font-medium placeholder:text-muted-foreground/40 ${errors.password ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20" : "border-border/60"
                                }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-[11px] font-bold text-destructive mt-1">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between mt-2 mb-2">
                    <p className="text-[13px] text-muted-foreground/80 font-medium">
                        Primera vez: usa tu DNI.
                    </p>
                </div>

                <Button
                    type="submit"
                    className="w-full h-10 text-white text-[14px] font-bold rounded-[3px] shadow-none flex items-center justify-center transition-all mt-6"
                    style={{ backgroundColor: brand }}
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Procesando...
                        </>
                    ) : (
                        "Continuar"
                    )}
                </Button>
            </form>

            <SocialAuth />

            <p className="text-center text-sm text-muted-foreground font-medium mt-6">
                ¿Aún no tienes cuenta?{" "}
                <Link href="/register" className="font-bold hover:underline" style={{ color: brand }}>
                    Crea una ahora
                </Link>
            </p>

            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border/30">
                <div className="h-5 w-5 rounded bg-muted/50 flex items-center justify-center">
                    <GraduationCap className="h-3 w-3 text-muted-foreground/60" strokeWidth={2} />
                </div>
                <span className="text-xs text-muted-foreground/50 font-medium">Flip</span>
                <span className="text-xs text-muted-foreground/30">·</span>
                <span className="text-xs text-muted-foreground/50">v0.0.1</span>
            </div>

            <InstitutionSelectorModal
                open={showInstitutionSelector}
                institutions={institutions}
                onSelect={handleInstitutionSelect}
                isLoading={isSelectingInstitution}
            />
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="bg-background border border-border/30 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 md:p-10 max-w-[400px] w-full rounded-lg relative z-10 font-sans">
                <div className="animate-pulse text-center text-muted-foreground">Cargando...</div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
