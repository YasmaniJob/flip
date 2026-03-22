"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUp, useSession } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, GraduationCap } from "lucide-react";
import { sileo } from "sileo";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { SocialAuth } from "@/components/auth/SocialAuth";
import { registerSchema, RegisterValues } from "@/lib/auth-schemas";
import { useAuthBranding } from "@/lib/use-auth-branding";

export default function RegisterPage() {
    const router = useRouter();
    const { data: session, isPending: isSessionPending } = useSession();
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { brand, institutionName, logoUrl } = useAuthBranding();

    const subtitle = institutionName 
        ? `Únete a ${institutionName}` 
        : "Únete a Flip y gestiona tus recursos de forma inteligente";

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const watchPassword = watch("password");
    const watchConfirmPassword = watch("confirmPassword");

    useEffect(() => {
        if (!isSessionPending && session) {
            router.push("/dashboard");
        }
    }, [session, isSessionPending, router]);

    const onSubmit = (values: RegisterValues) => {
        startTransition(async () => {
            try {
                const result = await signUp.email({
                    email: values.email,
                    password: values.password,
                    name: values.name,
                });

                if (result.error) {
                    sileo.error({
                        title: "No pudimos crear tu cuenta",
                        description: result.error.message || "Ocurrió un error al intentar registrarte. Por favor, intenta de nuevo.",
                        fill: "#fee2e2",
                        styles: {
                            title: "!text-red-900 font-bold",
                            description: "!text-red-800 font-medium",
                            badge: "!bg-red-500 !text-white"
                        }
                    });
                } else {
                    router.push("/onboarding");
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

    if (isSessionPending) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const passwordsMatch = !watchConfirmPassword || watchPassword === watchConfirmPassword;

    return (
        <div className="bg-background border border-border/30 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[400px] w-full rounded-lg relative z-10 font-sans">

            <AuthHeader 
                title="Crear cuenta"
                subtitle={subtitle}
                logoUrl={logoUrl}
                brandColor={brand}
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-[12px] font-bold text-foreground">
                        Nombre completo
                    </label>
                    <Input
                        type="text"
                        placeholder="Juan Pérez"
                        {...register("name")}
                        disabled={isPending}
                        style={{ borderColor: errors.name ? undefined : brand }}
                        className={`border-2 shadow-none rounded-[3px] h-10 px-3 bg-background text-sm focus-visible:ring-1 outline-none transition-all placeholder:font-medium placeholder:text-muted-foreground/40 ${errors.name ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20" : "border-border/60"
                            }`}
                    />
                    {errors.name && (
                        <p className="text-[11px] font-bold text-destructive mt-1">
                            {errors.name.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-[12px] font-bold text-foreground">
                        Correo electrónico
                    </label>
                    <Input
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
                    <label className="text-[12px] font-bold text-foreground">
                        Contraseña
                    </label>
                    <div className="relative">
                        <Input
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

                <div className="space-y-2">
                    <label className="text-[12px] font-bold text-foreground">
                        Confirmar contraseña
                    </label>
                    <div className="relative">
                        <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...register("confirmPassword")}
                            disabled={isPending}
                            style={{ borderColor: (!passwordsMatch || errors.confirmPassword) ? undefined : brand }}
                            className={`border-2 shadow-none rounded-[3px] h-10 py-2 bg-background text-sm focus-visible:ring-1 outline-none transition-all placeholder:font-medium placeholder:text-muted-foreground/40 ${!passwordsMatch || errors.confirmPassword ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20' : 'border-border/60'
                                }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    {!passwordsMatch && watchConfirmPassword && (
                        <p className="text-[11px] text-destructive font-bold flex items-center gap-1.5 mt-2">
                            Ojo, las contraseñas no coinciden
                        </p>
                    )}
                    {errors.confirmPassword && passwordsMatch && (
                        <p className="text-[11px] font-bold text-destructive mt-1">
                            {errors.confirmPassword.message}
                        </p>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-10 text-white text-[14px] font-bold rounded-[3px] shadow-none flex items-center justify-center transition-all mt-4"
                    style={{ backgroundColor: brand }}
                >
                    {isPending ? (
                        <>
                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Procesando...
                        </>
                    ) : (
                        "Crear cuenta"
                    )}
                </Button>
            </form>

            <SocialAuth />

            <p className="text-center text-[13px] text-muted-foreground font-medium mt-6">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/login" className="font-bold hover:underline" style={{ color: brand }}>
                    Inicia sesión
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
        </div>
    );
}
