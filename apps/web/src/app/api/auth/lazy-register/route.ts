import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { db } from '@/lib/db';
import { staff, users, sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { TooManyRequestsError } from '@/lib/utils/errors';
import { errorResponse } from '@/lib/utils/response';

type LazyRegisterRequest = {
  email: string;
  dni: string;
  selectedInstitutionId?: string; // Para cuando el usuario ya eligió
};

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    if (!rateLimit(`lazy-register-${ip}`, 5, 60 * 1000)) {
       throw new TooManyRequestsError();
    }
    const body: LazyRegisterRequest = await request.json();
    const { email, dni, selectedInstitutionId } = body;

    console.log('[Lazy Register] Request received:', { email, dni: dni.slice(0, 3) + '***', selectedInstitutionId });

    // Validación básica
    if (!email || !dni) {
      console.error('[Lazy Register] Missing email or dni');
      return NextResponse.json(
        { error: 'Email y DNI son requeridos' },
        { status: 400 }
      );
    }

    // 1. Buscar en staff por DNI
    const staffRecords = await db.query.staff.findMany({
      where: eq(staff.dni, dni),
      with: {
        institution: true,
      },
    });

    console.log('[Lazy Register] Staff records found:', staffRecords.length);

    // Si no hay registros con ese DNI
    if (staffRecords.length === 0) {
      console.error('[Lazy Register] DNI not found in any institution');
      return NextResponse.json(
        { error: 'No encontrado en ninguna institución. Contacte al administrador.' },
        { status: 404 }
      );
    }

    // 2. Validar que el email coincida en al menos un registro
    const matchingStaff = staffRecords.find(
      (s) => s.email?.toLowerCase() === email.toLowerCase()
    );

    if (!matchingStaff) {
      console.error('[Lazy Register] Email does not match DNI records');
      return NextResponse.json(
        { error: 'Los datos no coinciden. Verifique su email y DNI.' },
        { status: 403 }
      );
    }

    console.log('[Lazy Register] Email validated successfully');

    // 3. Determinar institución
    let targetInstitutionId: string;

    if (staffRecords.length === 1) {
      // Solo una institución
      targetInstitutionId = staffRecords[0].institutionId;
      console.log('[Lazy Register] Single institution detected:', targetInstitutionId);
    } else if (selectedInstitutionId) {
      // Usuario proporcionó un ID (desde localStorage o modal)
      // VALIDACIÓN DE SEGURIDAD: Verificar que el ID sea válido para este usuario
      const validSelection = staffRecords.find(
        (s) => s.institutionId === selectedInstitutionId
      );
      
      if (!validSelection) {
        // ID inválido o manipulado - ignorar y requerir selección manual
        console.warn('[Lazy Register] Invalid or outdated institution ID, requiring selection');
        return NextResponse.json({
          requiresSelection: true,
          institutions: staffRecords.map((s) => ({
            id: s.institutionId,
            name: s.institution.name,
            nivel: s.institution.nivel,
          })),
        });
      }
      
      targetInstitutionId = selectedInstitutionId;
      console.log('[Lazy Register] Valid institution ID from preference:', targetInstitutionId);
    } else {
      // Múltiples instituciones, requiere selección
      console.log('[Lazy Register] Multiple institutions, requiring selection');
      return NextResponse.json({
        requiresSelection: true,
        institutions: staffRecords.map((s) => ({
          id: s.institutionId,
          name: s.institution.name,
          nivel: s.institution.nivel,
        })),
      });
    }

    // 4. Verificar si el usuario ya existe
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    let userId: string;
    const staffRecord = staffRecords.find((s) => s.institutionId === targetInstitutionId)!;

    if (existingUser) {
      console.log('[Lazy Register] User already exists:', existingUser.id);
      userId = existingUser.id;

      // Actualizar institutionId si cambió
      if (existingUser.institutionId !== targetInstitutionId) {
        console.log('[Lazy Register] Updating user institutionId');
        await db
          .update(users)
          .set({ 
            institutionId: targetInstitutionId,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }
    } else {
      // 5. Crear nuevo usuario con Better Auth
      console.log('[Lazy Register] Creating new user account');
      
      // Password interno derivado de un HMAC del servidor:
      // - Impredecible sin conocer BETTER_AUTH_SECRET
      // - Determinístico: mismo resultado para la misma cuenta
      // - Nunca expuesto al usuario; solo usado internamente
      const secret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || '';
      
      if (!secret) {
        console.error('[Lazy Register] CRITICAL: No BETTER_AUTH_SECRET or AUTH_SECRET found');
        return NextResponse.json(
          { error: 'Error de configuración del servidor' },
          { status: 500 }
        );
      }
      
      const internalPassword = createHmac('sha256', secret)
        .update(`lazy:${email.toLowerCase()}:${dni}`)
        .digest('hex');
      
      try {
        // Usar Better Auth para crear el usuario
        const signUpResult = await auth.api.signUpEmail({
          body: {
            email: email.toLowerCase(),
            password: internalPassword,
            name: staffRecord.name,
          },
        });

        if (!signUpResult) {
          throw new Error('SignUp failed - no result returned');
        }

        // Extraer userId del resultado
        userId = (signUpResult as any).user?.id;
        
        if (!userId) {
          throw new Error('SignUp succeeded but no userId returned');
        }

        console.log('[Lazy Register] User created via Better Auth:', userId);

        // Actualizar campos adicionales
        await db
          .update(users)
          .set({
            institutionId: targetInstitutionId,
            dni: dni,
            role: staffRecord.role || 'docente',
            isSuperAdmin: false,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        console.log('[Lazy Register] User fields updated');
      } catch (signUpError) {
        console.error('[Lazy Register] Better Auth signUp failed:', signUpError);
        console.error('[Lazy Register] SignUp error details:', JSON.stringify(signUpError, null, 2));
        return NextResponse.json(
          { error: 'Error al crear la cuenta. Intente nuevamente.' },
          { status: 500 }
        );
      }
    }

    // 6. Crear sesión con Better Auth usando nextCookies plugin
    console.log('[Lazy Register] Creating session for user:', userId);
    
    try {
      // Con nextCookies, Better Auth maneja las cookies de Next.js nativamente
      // El password se deriva del mismo HMAC determinístico para garantizar consistencia
      const secret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || '';
      
      if (!secret) {
        console.error('[Lazy Register] CRITICAL: No BETTER_AUTH_SECRET or AUTH_SECRET found for signIn');
        return NextResponse.json(
          { error: 'Error de configuración del servidor' },
          { status: 500 }
        );
      }
      
      const internalPassword = createHmac('sha256', secret)
        .update(`lazy:${email.toLowerCase()}:${dni}`)
        .digest('hex');

      await auth.api.signInEmail({
        body: {
          email: email.toLowerCase(),
          password: internalPassword,
        },
      });

      console.log('[Lazy Register] Session created successfully');

      // 7. Actualizar activeInstitutionId en la sesión más reciente del usuario
      await db
        .update(sessions)
        .set({ 
          activeInstitutionId: targetInstitutionId,
          updatedAt: new Date(),
        })
        .where(eq(sessions.userId, userId));

      console.log('[Lazy Register] Session activeInstitutionId set:', targetInstitutionId);

      // 8. Retornar éxito - nextCookies maneja las cookies automáticamente
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
    } catch (signInError) {
      console.error('[Lazy Register] Session creation failed:', signInError);
      console.error('[Lazy Register] SignIn error details:', JSON.stringify(signInError, null, 2));
      return NextResponse.json(
        { error: 'Error al iniciar sesión. Intente nuevamente.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Lazy Register] Unexpected error:', error);
    if (error instanceof Error) {
      console.error('[Lazy Register] Error stack:', error.stack);
    }
    return errorResponse(error);
  }
}
