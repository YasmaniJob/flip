import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email({ message: "Ingresa un correo electrónico válido" }),
    password: z.string().min(1, { message: "La contraseña es requerida" }),
});

export const registerSchema = z.object({
    name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
    email: z.string().email({ message: "Ingresa un correo electrónico válido" }),
    password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
