"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, MailCheck } from "lucide-react";
import { sileo } from "sileo";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { useAuthBranding } from "@/lib/use-auth-branding";

const forgotPasswordSchema = z.object({
    email: z.string().email("Ingresa un correo válido"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isPending, startTransition] = useTransition();
    const [emailSent, setEmailSent] = useState(false);
    const [sentToEmail, setSentToEmail] = useState("");
    const { brand } = useAuthBranding();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    });

    const onSubmit = (values: ForgotPasswordValues) => {
        startTransition(async () => {
            try {
                const result = await authClient.requestPasswordReset({
                    email: values.email,
                    redirectTo: "/reset-password",
                });

                if (result.error) {
                    sileo.error({
                        title: "No pudimos procesar tu solicitud",
                        description: "Verifica que el correo sea correcto e intenta de nuevo.",
                        fill: "#fee2e2",
                        styles: {
                            title: "!text-red-900 font-bold",
                            description: "!text-red-800 font-medium",
                            badge: "!bg-red-500 !text-white",
                        },
                    });
                } else {
                    setSentToEmail(values.email);
                    setEmailSent(true);
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

    if (emailSent) {
        return (
            <div className="bg-background border border-border/30 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[400px] w-full rounded-lg relative z-10 font-sans">
                <div className="flex flex-col items-center text-center">
                    <div
                        className="h-14 w-14 rounded-lg flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                        style={{ backgroundColor: brand }}
                    >
                        <MailCheck className="h-7 w-7 text-white" strokeWidth={2} />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground mb-2">
                        Revisa tu correo
                    </h1>
                    <p className="text-[13px] font-medium text-muted-foreground/80 leading-relaxed max-w-[260px]">
                        Si existe una cuenta asociada a{" "}
                        <span className="text-foreground font-semibold">{sentToEmail}</span>,
                        recibirás un enlace para restablecer tu contraseña.
                    </p>
                </div>

                <div className="mt-8 space-y-3">
                    <p className="text-center text-[12px] text-muted-foreground/60 font-medium">
                        ¿No recibiste el correo? Revisa tu carpeta de spam.
                    </p>
                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 text-[13px] font-bold hover:underline w-full"
                        style={{ color: brand }}
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Volver al inicio de sesión
                    </Link>
                </div>

                <div className="flex items-center justify-center gap-2 mt-8 pt-4 border-t border-border/30">
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

    return (
        <div className="bg-background border border-border/30 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[400px] w-full rounded-lg relative z-10 font-sans">
            <AuthHeader
                title="Flip"
                subtitle="Restablece tu contraseña"
                brandColor={brand}
            />

            <p className="text-[13px] text-muted-foreground/80 font-medium text-center -mt-4 mb-6 leading-relaxed">
                Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
            </p>

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
                        className={`border-2 shadow-none rounded-[3px] h-10 px-3 bg-background text-sm focus-visible:ring-1 outline-none transition-all placeholder:font-medium placeholder:text-muted-foreground/40 ${
                            errors.email
                                ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                                : "border-border/60"
                        }`}
                    />
                    {errors.email && (
                        <p className="text-[11px] font-bold text-destructive mt-1">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full h-10 text-white text-[14px] font-bold rounded-[3px] shadow-none flex items-center justify-center transition-all"
                    style={{ backgroundColor: brand }}
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Enviando...
                        </>
                    ) : (
                        "Enviar enlace"
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
