'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/ui/input';
import { 
    Form, 
    FormControl, 
    FormField, 
    FormItem, 
    FormLabel, 
    FormMessage,
    FormDescription
} from '@/components/ui/form';
import { 
    User, 
    Mail, 
    Fingerprint, 
    Phone, 
    ArrowRight, 
    Loader2,
    ShieldCheck,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

// Reusing schemas similar to diagnostic
const formSchema = z.object({
  dni: z.string()
    .regex(/^\d{8}$/, 'El DNI debe tener 8 dígitos')
    .min(1, 'El DNI es obligatorio'),
  name: z.string()
    .min(3, 'Ingresa tu nombre completo')
    .max(100, 'El nombre es demasiado largo'),
  email: z.string()
    .email('Email inválido')
    .min(1, 'El email es obligatorio'),
  phone: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface AttendanceIdentificationFormProps {
    reservationId: string;
    onSuccess?: (data: any) => void;
    initialData?: Partial<FormValues>;
}

export function AttendanceIdentificationForm({ reservationId, onSuccess, initialData }: AttendanceIdentificationFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [registeredName, setRegisteredName] = useState('');

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            dni: initialData?.dni || '',
            name: initialData?.name || '',
            email: initialData?.email || '',
            phone: initialData?.phone || '',
        },
    });

    async function onSubmit(values: FormValues) {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/classroom-reservations/${reservationId}/attendance/register-check-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al registrar asistencia');
            }

            setRegisteredName(values.name);
            setIsSuccess(true);
            onSuccess?.(data);
        } catch (error) {
            console.error('[Attendance Form] Error:', error);
            toast.error('Hubo un problema', {
                description: error instanceof Error ? error.message : 'Error desconocido'
            });
        } finally {
            setIsLoading(false);
        }
    }

    if (isSuccess) {
        return (
            <div className="w-full max-w-md mx-auto animate-in zoom-in-95 duration-500">
                <div className="bg-card border-2 border-primary/20 rounded-sm p-10 text-center space-y-8">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-10 w-10 text-primary" />
                    </div>
                    
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
                            ¡Asistencia Registrada!
                        </h2>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
                            Gracias, {registeredName.split(' ')[0]}
                        </p>
                    </div>

                    <div className="p-6 bg-muted/20 border border-border rounded-sm space-y-4">
                        <p className="text-[11px] font-bold text-foreground uppercase tracking-widest leading-relaxed">
                            Tu cuenta ha sido activada
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Ahora puedes ingresar a FLIP usando tu **Email** y tu **DNI** como contraseña.
                        </p>
                        <Button 
                            asChild
                            variant="outline" 
                            className="w-full h-11 text-[10px] font-black uppercase tracking-widest border-border hover:bg-primary hover:text-white transition-all rounded-none shadow-none"
                        >
                            <Link href="/login">Ir al Login</Link>
                        </Button>
                    </div>

                    <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
                        FLIP &bull; Gestión Inteligente
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden shadow-none">
                {/* Header Block */}
                <div className="px-8 py-8 border-b border-border bg-muted/5">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-foreground uppercase tracking-tight leading-none">
                                Registro de Asistencia
                            </h2>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2">
                                Completa tus datos para ingresar al taller
                            </p>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-primary/[0.03] border border-primary/10 rounded-none">
                        <p className="text-[11px] text-primary font-bold leading-relaxed">
                            Al registrarte, se creará automáticamente tu cuenta institucional en FLIP para que puedas acceder a tus reportes pedagógicos.
                        </p>
                    </div>
                </div>

                <div className="p-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                {/* DNI */}
                                <FormField
                                    control={form.control}
                                    name="dni"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">DNI / Documento</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                                    <Input 
                                                        {...field} 
                                                        placeholder="8 DÍGITOS"
                                                        maxLength={8}
                                                        className="pl-12 h-12 bg-muted/20 border-border focus:bg-background transition-all text-sm font-black tracking-widest uppercase"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[10px] font-bold uppercase tracking-tight" />
                                        </FormItem>
                                    )}
                                />

                                {/* Name */}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Nombre Completo</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                                    <Input 
                                                        {...field} 
                                                        placeholder="EJ: JUAN PÉREZ"
                                                        className="pl-12 h-12 bg-muted/20 border-border focus:bg-background transition-all text-sm font-black uppercase tracking-tight"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[10px] font-bold uppercase tracking-tight" />
                                        </FormItem>
                                    )}
                                />

                                {/* Email */}
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Correo Electrónico</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                                    <Input 
                                                        {...field} 
                                                        type="email"
                                                        placeholder="EJ: DOCENTE@EMAIL.COM"
                                                        className="pl-12 h-12 bg-muted/20 border-border focus:bg-background transition-all text-sm font-black uppercase tracking-tight"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[10px] font-bold uppercase tracking-tight" />
                                        </FormItem>
                                    )}
                                />

                                {/* Phone */}
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Celular (Opcional)</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                                    <Input 
                                                        {...field} 
                                                        placeholder="999 999 999"
                                                        className="pl-12 h-12 bg-muted/20 border-border focus:bg-background transition-all text-sm font-black uppercase tracking-tight"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-[0.2em] rounded-sm transition-all group active:scale-[0.98] border-none"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <span className="flex items-center gap-3">
                                        Registrar mi Asistencia
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    </Form>
                </div>
                
                <div className="px-8 py-6 bg-muted/20 border-t border-border flex items-center justify-center gap-3">
                    <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/40" />
                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                        FLIP — Gestión Pedagógica Inteligente
                    </p>
                </div>
            </div>
        </div>
    );
}
