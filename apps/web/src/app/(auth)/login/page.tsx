"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { useState } from "react";
import { sileo } from "sileo";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { SocialAuth } from "@/components/auth/SocialAuth";
import { loginSchema, LoginValues } from "@/lib/auth-schemas";
import { useAuthBranding } from "@/lib/use-auth-branding";

export default function LoginPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const { brand, institutionName, logoUrl } = useAuthBranding();

    const subtitle = institutionName 
        ? `Bienvenido a ${institutionName}` 
        : "Sistema de Gestión y Préstamos";

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

    const onSubmit = (values: LoginValues) => {
        startTransition(async () => {
            try {
                const result = await signIn.email({
                    email: values.email,
                    password: values.password,
                });

                if (result.error) {
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
        </div>
    );
}
