import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { staff, users, sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

type LazyRegisterRequest = {
  email: string;
  dni: string;
  selectedInstitutionId?: string; // Para cuando el usuario ya eligió
};

export async function POST(request: NextRequest) {
  try {
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
      // Usuario ya eligió institución
      const validSelection = staffRecords.find(
        (s) => s.institutionId === selectedInstitutionId
      );
      
      if (!validSelection) {
        console.error('[Lazy Register] Invalid institution selection');
        return NextResponse.json(
          { error: 'Institución seleccionada no válida' },
          { status: 400 }
        );
      }
      
      targetInstitutionId = selectedInstitutionId;
      console.log('[Lazy Register] Institution selected by user:', targetInstitutionId);
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
      
      // Generar password interno (nunca se muestra al usuario)
      const internalPassword = `LAZY_${dni}_${targetInstitutionId.slice(-6)}`;
      
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
      await auth.api.signInEmail({
        body: {
          email: email.toLowerCase(),
          password: `LAZY_${dni}_${targetInstitutionId.slice(-6)}`,
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
      return NextResponse.json(
        { error: 'Error al iniciar sesión. Intente nuevamente.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Lazy Register] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
