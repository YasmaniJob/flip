import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { staff, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

const lazyRegisterSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  dni: z.string().min(8, { message: "DNI debe tener al menos 8 caracteres" }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = lazyRegisterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, dni } = validation.data;

    // 1. Buscar staff con email + DNI
    const staffMember = await db
      .select()
      .from(staff)
      .where(and(eq(staff.email, email), eq(staff.dni, dni)))
      .limit(1);

    if (staffMember.length === 0) {
      return NextResponse.json(
        { 
          error: "No encontrado", 
          message: "No se encontró un registro de personal con ese correo y DNI. Contacta al administrador de tu institución." 
        },
        { status: 404 }
      );
    }

    const staffData = staffMember[0];

    // 2. Verificar si el usuario ya existe en Better Auth
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { 
          error: "Usuario ya existe", 
          message: "Ya existe una cuenta con este correo. Usa tu contraseña para iniciar sesión." 
        },
        { status: 409 }
      );
    }

    // 3. Crear usuario usando Better Auth API (maneja hashing automáticamente)
    await auth.api.signUpEmail({
      body: {
        email: staffData.email!,
        password: dni,
        name: staffData.name,
        // Better Auth custom fields
        institutionId: staffData.institutionId,
        role: staffData.role || "docente",
      },
    });

    // 4. Actualizar el DNI en la tabla users (no está en additionalFields de Better Auth)
    await db
      .update(users)
      .set({ dni: staffData.dni })
      .where(eq(users.email, staffData.email!));

    return NextResponse.json({
      success: true,
      message: "Cuenta creada exitosamente",
      user: {
        email: staffData.email,
        name: staffData.name,
        institutionId: staffData.institutionId,
        role: staffData.role,
      },
    });
  } catch (error) {
    console.error("Lazy register error:", error);
    return NextResponse.json(
      { 
        error: "Error del servidor", 
        message: "Ocurrió un error al procesar tu solicitud. Intenta de nuevo." 
      },
      { status: 500 }
    );
  }
}
