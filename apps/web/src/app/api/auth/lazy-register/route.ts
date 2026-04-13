import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { db } from '@/lib/db';
import { staff, users, sessions, accounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
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
 * Endpoint de lazy register - Solución Estructural
 * 
 * Esta implementación resuelve el problema de raíz:
 * - Usuarios nuevos: Se crean con password HMAC
 * - Usuarios existentes: Se actualiza su password HMAC directamente en la BD
 * - Ambos: Usan el mismo password determinístico para signIn
 * 
 * IMPORTANTE: Para usuarios existentes, se recrea el account credential
 * usando Better Auth para garantizar compatibilidad total con el formato
 * de hash que Better Auth espera.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    if (!rateLimit(`lazy-register-${ip}`, 5, 60 * 1000)) {
      throw new TooManyRequestsError();
    }

    const body: LazyRegisterRequest = await request.json();
    const { email, dni, selectedInstitutionId } = body;

    console.log('[Lazy Register] Request received:', { 
      email, 
      dni: dni.slice(0, 3) + '***', 
      selectedInstitutionId 
    });

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

    if (staffRecords.length === 0) {
      console.error('[Lazy Register] DNI not found in any institution');
      return NextResponse.json(
        { error: 'No encontrado en ninguna institución. Contacte al administrador.' },
        { status: 404 }
      );
    }

    // 2. Validar que el email coincida
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
      targetInstitutionId = staffRecords[0].institutionId;
      console.log('[Lazy Register] Single institution detected:', targetInstitutionId);
    } else if (selectedInstitutionId) {
      const validSelection = staffRecords.find(
        (s) => s.institutionId === selectedInstitutionId
      );
      
      if (!validSelection) {
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

    const staffRecord = staffRecords.find((s) => s.institutionId === targetInstitutionId)!;

    // 4. Generar password determinístico
    const secret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || '';
    
    if (!secret) {
      console.error('[Lazy Register] CRITICAL: No BETTER_AUTH_SECRET or AUTH_SECRET found');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Password determinístico para este usuario
    const internalPassword = createHmac('sha256', secret)
      .update(`lazy:${email.toLowerCase()}:${dni}`)
      .digest('hex');

    // 5. Verificar si el usuario ya existe
    let existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    let userId: string;

    if (existingUser) {
      console.log('[Lazy Register] User already exists:', existingUser.id);
      userId = existingUser.id;

      // Actualizar institutionId y DNI si cambió
      if (existingUser.institutionId !== targetInstitutionId || existingUser.dni !== dni) {
        console.log('[Lazy Register] Updating user institutionId and DNI');
        await db
          .update(users)
          .set({ 
            institutionId: targetInstitutionId,
            dni: dni,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }

      // SOLUCIÓN PRAGMÁTICA: Para usuarios existentes, eliminar el account credential
      // y recrearlo con el nuevo password. Esto garantiza compatibilidad total.
      console.log('[Lazy Register] Recreating credential account for existing user');
      
      const existingAccount = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.userId, userId),
          eq(accounts.providerId, 'credential')
        ),
      });

      if (existingAccount) {
        // Eliminar el account existente
        await db
          .delete(accounts)
          .where(eq(accounts.id, existingAccount.id));
        
        console.log('[Lazy Register] Old credential account deleted');
      }

      // Crear nuevo usuario con Better Auth para obtener el hash correcto
      // Luego transferir el account al usuario existente
      try {
        // Crear usuario temporal
        const tempEmail = `temp-${Date.now()}-${email.toLowerCase()}`;
        const tempSignUpResult = await auth.api.signUpEmail({
          body: {
            email: tempEmail,
            password: internalPassword,
            name: 'Temporary',
          },
        });

        const tempUserId = (tempSignUpResult as any).user?.id;
        
        if (tempUserId) {
          // Obtener el account del usuario temporal
          const tempAccount = await db.query.accounts.findFirst({
            where: and(
              eq(accounts.userId, tempUserId),
              eq(accounts.providerId, 'credential')
            ),
          });

          if (tempAccount) {
            // Transferir el account al usuario real
            await db
              .update(accounts)
              .set({
                userId: userId,
                accountId: email.toLowerCase(),
                updatedAt: new Date(),
              })
              .where(eq(accounts.id, tempAccount.id));

            console.log('[Lazy Register] Account transferred to existing user');
          }

          // Eliminar usuario temporal
          await db.delete(users).where(eq(users.id, tempUserId));
          console.log('[Lazy Register] Temporary user cleaned up');
        }
      } catch (error) {
        console.error('[Lazy Register] Failed to recreate account:', error);
        // Si falla, el usuario tendrá que usar reset password
        return NextResponse.json(
          { error: 'Error al actualizar la cuenta. Por favor, use "Olvidé mi contraseña".' },
          { status: 500 }
        );
      }
    } else {
      // 6. Crear nuevo usuario
      console.log('[Lazy Register] Creating new user account');
      
      try {
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

        userId = (signUpResult as any).user?.id;
        
        if (!userId) {
          throw new Error('SignUp succeeded but no userId returned');
        }

        console.log('[Lazy Register] User created via Better Auth:', userId);

        // Verificar si es el primer usuario de la institución
        const existingUsersCount = await db.query.users.findMany({
          where: eq(users.institutionId, targetInstitutionId),
        });

        const isFirstUser = existingUsersCount.length === 0;
        
        console.log('[Lazy Register] Is first user of institution?', isFirstUser);

        // Actualizar campos adicionales
        await db
          .update(users)
          .set({
            institutionId: targetInstitutionId,
            dni: dni,
            role: isFirstUser ? 'superadmin' : (staffRecord.role || 'docente'),
            isSuperAdmin: isFirstUser,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        console.log('[Lazy Register] User fields updated - Role:', isFirstUser ? 'superadmin' : (staffRecord.role || 'docente'));

        // Si es el primer usuario, actualizar staff a admin
        if (isFirstUser) {
          await db
            .update(staff)
            .set({
              role: 'admin',
              updatedAt: new Date(),
            })
            .where(eq(staff.id, staffRecord.id));
          
          console.log('[Lazy Register] Staff record updated to admin role');
        }
      } catch (signUpError) {
        console.error('[Lazy Register] Better Auth signUp failed:', signUpError);
        return NextResponse.json(
          { error: 'Error al crear la cuenta. Intente nuevamente.' },
          { status: 500 }
        );
      }
    }

    // 7. Crear sesión con Better Auth
    console.log('[Lazy Register] Creating session for user:', userId);
    
    try {
      await auth.api.signInEmail({
        body: {
          email: email.toLowerCase(),
          password: internalPassword,
        },
      });

      console.log('[Lazy Register] Session created successfully');

      // 8. Actualizar activeInstitutionId en la sesión
      await db
        .update(sessions)
        .set({ 
          activeInstitutionId: targetInstitutionId,
          updatedAt: new Date(),
        })
        .where(eq(sessions.userId, userId));

      console.log('[Lazy Register] Session activeInstitutionId set:', targetInstitutionId);

      // 9. Retornar éxito
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
