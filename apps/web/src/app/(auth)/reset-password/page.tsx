"use client";

import Link from "next/link";
import { useTransition, useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff, GraduationCap, ShieldCheck, AlertTriangle } from "lucide-react";
import { sileo } from "sileo";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { useAuthBranding } from "@/lib/use-auth-branding";
import { useRouter } from "next/navigation";
import { APP_VERSION } from "@/lib/version";

const resetPasswordSchema = z.object({
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [success, setSuccess] = useState(false);
    const [tokenError, setTokenError] = useState(false);
    const { brand } = useAuthBranding();
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    useEffect(() => {
        if (error === "INVALID_TOKEN" || !token) {
            setTokenError(true);
        }
    }, [error, token]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    const onSubmit = (values: ResetPasswordValues) => {
        if (!token) return;
        startTransition(async () => {
            try {
                const result = await authClient.resetPassword({
                    newPassword: values.password,
                    token,
                });

                if (result.error) {
                    sileo.error({
                        title: "No pudimos restablecer tu contraseña",
                        description: "El enlace puede haber expirado. Solicita uno nuevo.",
                        fill: "#fee2e2",
                        styles: {
                            title: "!text-red-900 font-bold",
                            description: "!text-red-800 font-medium",
                            badge: "!bg-red-500 !text-white",
                        },
                    });
                } else {
                    setSuccess(true);
                    setTimeout(() => router.push("/login"), 3000);
                }
            } catch {
                sileo.error({
                    title: "Problema de conexión",
                    description: "Revisa tu conexión a internet o intenta de nuevo en unos minutos.",
                    fill: "#fff7ed",
                    styles: {
                        title: "!text-orange-900 font-bold",
                        description: "!text-orange-800 font-medium",
                        badge: "!bg-orange-500 !text-white",
                    },
                });
            }
        });
    };

    const footer = (
        <div className="flex items-center justify-center gap-2 mt-8 pt-4 border-t border-border/30">
            <div className="h-5 w-5 rounded bg-muted/50 flex items-center justify-center">
                <GraduationCap className="h-3 w-3 text-muted-foreground/60" strokeWidth={2} />
            </div>
            <span className="text-xs text-muted-foreground/50 font-medium">Flip</span>
            <span className="text-xs text-muted-foreground/30">·</span>
            <span className="text-xs text-muted-foreground/50">v{APP_VERSION}</span>
        </div>
    );

    if (tokenError) {
        return (
            <div className="bg-background border border-border/30 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[400px] w-full rounded-lg relative z-10 font-sans">
                <div className="flex flex-col items-center text-center">
                    <div className="h-14 w-14 rounded-lg flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.15)] bg-destructive/10">
                        <AlertTriangle className="h-7 w-7 text-destructive" strokeWidth={2} />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground mb-2">
                        Enlace inválido o expirado
                    </h1>
                    <p className="text-[13px] font-medium text-muted-foreground/80 leading-relaxed max-w-[260px]">
                        Este enlace para restablecer contraseña no es válido o ya expiró. Solicita uno nuevo.
                    </p>
                </div>
                <div className="mt-6 text-center">
                    <Link
                        href="/forgot-password"
                        className="flex items-center justify-center gap-1.5 text-[13px] font-bold hover:underline"
                        style={{ color: brand }}
                    >
                        Solicitar nuevo enlace
                    </Link>
                </div>
                {footer}
            </div>
        );
    }

    if (success) {
        return (
            <div className="bg-background border border-border/30 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[400px] w-full rounded-lg relative z-10 font-sans">
                <div className="flex flex-col items-center text-center">
                    <div
                        className="h-14 w-14 rounded-lg flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                        style={{ backgroundColor: brand }}
                    >
                        <ShieldCheck className="h-7 w-7 text-white" strokeWidth={2} />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground mb-2">
                        ¡Contraseña actualizada!
                    </h1>
                    <p className="text-[13px] font-medium text-muted-foreground/80 leading-relaxed max-w-[260px]">
                        Tu contraseña ha sido restablecida correctamente. Redirigiendo al login...
                    </p>
                </div>
                {footer}
            </div>
        );
    }

    return (
        <div className="bg-background border border-border/30 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[400px] w-full rounded-lg relative z-10 font-sans">
            <AuthHeader
                title="Flip"
                subtitle="Nueva contraseña"
                brandColor={brand}
            />

            <p className="text-[13px] text-muted-foreground/80 font-medium text-center -mt-4 mb-6 leading-relaxed">
                Elige una contraseña segura de al menos 6 caracteres.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                    <label htmlFor="password" className="text-[12px] font-bold text-foreground">
                        Nueva contraseña
                    </label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...register("password")}
                            disabled={isPending}
                            style={{ borderColor: errors.password ? undefined : brand }}
                            className={`border-2 shadow-none rounded-[3px] h-10 pl-3 pr-10 bg-background text-sm focus-visible:ring-1 outline-none transition-all placeholder:font-medium placeholder:text-muted-foreground/40 ${
                                errors.password
                                    ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                                    : "border-border/60"
                            }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-[11px] font-bold text-destructive mt-1">{errors.password.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-[12px] font-bold text-foreground">
                        Confirmar contraseña
                    </label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirm ? "text" : "password"}
                            placeholder="••••••••"
                            {...register("confirmPassword")}
                            disabled={isPending}
                            style={{ borderColor: errors.confirmPassword ? undefined : brand }}
                            className={`border-2 shadow-none rounded-[3px] h-10 pl-3 pr-10 bg-background text-sm focus-visible:ring-1 outline-none transition-all placeholder:font-medium placeholder:text-muted-foreground/40 ${
                                errors.confirmPassword
                                    ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                                    : "border-border/60"
                            }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                        >
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="text-[11px] font-bold text-destructive mt-1">{errors.confirmPassword.message}</p>
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full h-10 text-white text-[14px] font-bold rounded-[3px] shadow-none flex items-center justify-center transition-all mt-2"
                    style={{ backgroundColor: brand }}
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Actualizando...
                        </>
                    ) : (
                        "Restablecer contraseña"
                    )}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <Link
                    href="/login"
                    className="flex items-center justify-center gap-1.5 text-[13px] font-bold hover:underline"
                    style={{ color: brand }}
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Volver al inicio de sesión
                </Link>
            </div>

            {footer}
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="bg-background border border-border/30 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 md:p-10 max-w-[400px] w-full rounded-lg relative z-10 font-sans">
                <div className="flex items-center justify-center h-64">
                    <span className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
