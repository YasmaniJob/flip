import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { db } from '@/lib/db';
import { staff, users, sessions, accounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { TooManyRequestsError } from '@/lib/utils/errors';
import { errorResponse } from '@/lib/utils/response';

type LazyRegisterRequest = {
  email: string;
  dni: string;
  selectedInstitutionId?: string;
};

/**
 * Lazy Register Endpoint
 * 
 * Permite a usuarios del staff autenticarse usando email + DNI.
 * El sistema valida contra la tabla staff y crea/actualiza el usuario automáticamente.
 * 
 * Flujo:
 * 1. Valida DNI + Email contra tabla staff
 * 2. Determina institución (única o requiere selección)
 * 3. Crea/recrea usuario con password determinístico
 * 4. Establece sesión y redirige al dashboard
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    if (!rateLimit(`lazy-register-${ip}`, 5, 60 * 1000)) {
      throw new TooManyRequestsError();
    }

    const { email, dni, selectedInstitutionId } = await request.json() as LazyRegisterRequest;

    // Validación de entrada
    if (!email || !dni) {
      return NextResponse.json(
        { error: 'Email y DNI son requeridos' },
        { status: 400 }
      );
    }

    // Buscar y validar staff
    const staffRecords = await db.query.staff.findMany({
      where: eq(staff.dni, dni),
      with: { institution: true },
    });

    if (staffRecords.length === 0) {
      return NextResponse.json(
        { error: 'No encontrado en ninguna institución. Contacte al administrador.' },
        { status: 404 }
      );
    }

    const matchingStaff = staffRecords.find(
      (s) => s.email?.toLowerCase() === email.toLowerCase()
    );

    if (!matchingStaff) {
      return NextResponse.json(
        { error: 'Los datos no coinciden. Verifique su email y DNI.' },
        { status: 403 }
      );
    }

    // Determinar institución
    const targetInstitutionId = await determineInstitution(
      staffRecords,
      selectedInstitutionId
    );

    if (!targetInstitutionId) {
      return NextResponse.json({
        requiresSelection: true,
        institutions: staffRecords.map((s) => ({
          id: s.institutionId,
          name: s.institution.name,
          nivel: s.institution.nivel,
        })),
      });
    }

    const staffRecord = staffRecords.find((s) => s.institutionId === targetInstitutionId)!;

    // Generar password determinístico
    const secret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    const internalPassword = createHmac('sha256', secret)
      .update(`lazy:${email.toLowerCase()}:${dni}`)
      .digest('hex');

    // Limpiar usuario existente si existe
    await cleanupExistingUser(email.toLowerCase());

    // Crear usuario
    const userId = await createUser(
      email.toLowerCase(),
      internalPassword,
      staffRecord,
      targetInstitutionId,
      dni
    );

    // Crear sesión
    await auth.api.signInEmail({
      body: {
        email: email.toLowerCase(),
        password: internalPassword,
      },
    });

    // Actualizar activeInstitutionId en la sesión
    await db
      .update(sessions)
      .set({ 
        activeInstitutionId: targetInstitutionId,
        updatedAt: new Date(),
      })
      .where(eq(sessions.userId, userId));

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: email.toLowerCase(),
        name: staffRecord.name,
        institutionId: targetInstitutionId,
        role: staffRecord.role || 'docente',
      },
      redirectTo: '/dashboard',
    });
  } catch (error) {
    console.error('[Lazy Register] Error:', error);
    return errorResponse(error);
  }
}

/**
 * Determina la institución objetivo
 * Retorna el ID si es única o válida, null si requiere selección
 */
async function determineInstitution(
  staffRecords: any[],
  selectedInstitutionId?: string
): Promise<string | null> {
  if (staffRecords.length === 1) {
    return staffRecords[0].institutionId;
  }

  if (selectedInstitutionId) {
    const validSelection = staffRecords.find(
      (s) => s.institutionId === selectedInstitutionId
    );
    return validSelection ? selectedInstitutionId : null;
  }

  return null;
}

/**
 * Limpia un usuario existente y sus relaciones
 */
async function cleanupExistingUser(email: string): Promise<void> {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    await db.delete(accounts).where(eq(accounts.userId, existingUser.id));
    await db.delete(sessions).where(eq(sessions.userId, existingUser.id));
    await db.delete(users).where(eq(users.id, existingUser.id));
  }
}

/**
 * Crea un nuevo usuario con Better Auth y actualiza sus campos
 */
async function createUser(
  email: string,
  password: string,
  staffRecord: any,
  institutionId: string,
  dni: string
): Promise<string> {
  const signUpResult = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: staffRecord.name,
    },
  });

  const userId = (signUpResult as any).user?.id;
  if (!userId) {
    throw new Error('Failed to create user');
  }

  // Verificar si es el primer usuario de la institución
  const existingUsers = await db.query.users.findMany({
    where: eq(users.institutionId, institutionId),
  });

  const isFirstUser = existingUsers.length === 0;
  const role = isFirstUser ? 'superadmin' : (staffRecord.role || 'docente');

  // Actualizar campos del usuario
  await db
    .update(users)
    .set({
      institutionId,
      dni,
      role,
      isSuperAdmin: isFirstUser,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Si es el primer usuario, actualizar staff a admin
  if (isFirstUser) {
    await db
      .update(staff)
      .set({
        role: 'admin',
        updatedAt: new Date(),
      })
      .where(eq(staff.id, staffRecord.id));
  }

  return userId;
}
