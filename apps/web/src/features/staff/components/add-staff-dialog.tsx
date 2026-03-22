"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ChevronRight, Mail, Phone, Hash, ShieldCheck } from "lucide-react";
import { createStaffSchema, CreateStaffInput } from "@flip/shared";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useStaff } from "../hooks/use-staff";
import { useUserRole } from "@/hooks/use-user-role";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddStaffDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: CreateStaffInput & { id: string };
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({ label, icon: Icon, error, children }: {
    label: string;
    icon?: React.ElementType;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                {Icon && <Icon className="h-3 w-3" />}
                {label}
            </Label>
            {children}
            {error && <p className="text-[10px] font-bold text-destructive">{error}</p>}
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddStaffDialog({ open, onOpenChange, initialData }: AddStaffDialogProps) {
    const { createStaff, updateStaff } = useStaff();
    const { isSuperAdmin } = useUserRole();
    const [submitting, setSubmitting]  = useState(false);
    const isEditing = !!initialData;

    const { register, handleSubmit, reset, watch, setValue, formState: { errors, isValid, isDirty } } =
        useForm<CreateStaffInput>({
            resolver: zodResolver(createStaffSchema) as unknown as any,
            mode: "onChange",
            defaultValues: {
                name:  initialData?.name  ?? "",
                dni:   initialData?.dni   ?? "",
                email: initialData?.email ?? "",
                phone: initialData?.phone ?? "",
                role:  initialData?.role  ?? "docente",
                area:  initialData?.area  ?? "",
            },
        });

    const watchedName = watch("name");
    const watchedRole = watch("role");

    // Sanitize data to avoid null values in the form
    const sanitize = (data: any) => {
        if (!data) return { role: "docente", name: "", dni: "", email: "", phone: "", area: "" };
        return {
            name:  data.name  ?? "",
            dni:   data.dni   ?? "",
            email: data.email ?? "",
            phone: data.phone ?? "",
            role:  data.role  ?? "docente",
            area:  data.area  ?? "",
        };
    };

    useEffect(() => {
        if (open) {
            reset(sanitize(initialData));
        }
    }, [open, initialData, reset]);

    const onSubmit = async (data: CreateStaffInput) => {
        setSubmitting(true);
        try {
            if (isEditing && initialData?.id) {
                await updateStaff.mutateAsync({ id: initialData.id, data });
            } else {
                await createStaff.mutateAsync(data);
            }
            reset();
            onOpenChange(false);
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-[520px] p-0 gap-0 overflow-hidden border border-border shadow-none rounded-none"
            >
                <DialogTitle className="sr-only">
                    {isEditing ? "Editar Personal" : "Nuevo Personal"}
                </DialogTitle>

                {/* Header */}
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                            {isEditing ? "Editar Personal" : "Nuevo Personal"}
                        </h2>
                    </div>

                    {/* Avatar preview */}
                    {watchedName && (
                        <div className="h-9 w-9 border border-border bg-muted/40 flex items-center justify-center text-sm font-black text-foreground/60">
                            {watchedName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Form */}
                <div className="p-6 space-y-5">
                    <Field label="Nombre Completo *" error={errors.name?.message}>
                        <Input
                            {...register("name")}
                            placeholder="Ej. Juan Pérez"
                            autoFocus
                            className={cn("h-9 rounded-none", errors.name && "border-destructive")}
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="DNI" icon={Hash} error={errors.dni?.message}>
                            <Input
                                {...register("dni")}
                                placeholder="00000000"
                                className="h-9 rounded-none font-mono"
                            />
                        </Field>
                        <Field label="Teléfono" icon={Phone}>
                            <Input
                                {...register("phone")}
                                placeholder="999 999 999"
                                className="h-9 rounded-none font-mono"
                            />
                        </Field>
                    </div>

                    <Field label="Email" icon={Mail} error={errors.email?.message}>
                        <Input
                            {...register("email")}
                            type="email"
                            placeholder="juan.perez@ejemplo.com"
                            className={cn("h-9 rounded-none", errors.email && "border-destructive")}
                        />
                    </Field>

                    <Field label="Rol" icon={ShieldCheck}>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={watchedRole === "docente" ? "jira" : "jiraOutline"}
                                className="flex-1 rounded-none px-0 text-xs"
                                onClick={() => setValue("role", "docente", { shouldValidate: true, shouldDirty: true })}
                            >
                                Docente
                            </Button>
                            <Button
                                type="button"
                                variant={watchedRole === "pip" ? "jira" : "jiraOutline"}
                                className="flex-1 rounded-none px-0 text-xs"
                                onClick={() => setValue("role", "pip", { shouldValidate: true, shouldDirty: true })}
                            >
                                PIP
                            </Button>
                            {isSuperAdmin && (
                                <>
                                    <Button
                                        type="button"
                                        variant={watchedRole === "admin" ? "jira" : "jiraOutline"}
                                        className="flex-1 rounded-none px-0 text-xs"
                                        onClick={() => setValue("role", "admin", { shouldValidate: true, shouldDirty: true })}
                                    >
                                        Admin
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={watchedRole === "superadmin" ? "jira" : "jiraOutline"}
                                        className="flex-1 rounded-none px-0 text-xs"
                                        onClick={() => setValue("role", "superadmin", { shouldValidate: true, shouldDirty: true })}
                                    >
                                        Superadmin
                                    </Button>
                                </>
                            )}
                        </div>
                    </Field>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-none"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="jira"
                        onClick={handleSubmit(onSubmit)}
                        disabled={submitting || !isValid || (isEditing && !isDirty)}
                        className="rounded-none min-w-[140px]"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                {isEditing ? "Guardar Cambios" : "Guardar Personal"}
                                <ChevronRight className="h-3.5 w-3.5 ml-2" />
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
