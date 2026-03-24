import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { staff, sessions, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

type SetActiveInstitutionRequest = {
  institutionId: string;
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body: SetActiveInstitutionRequest = await request.json();
    const { institutionId } = body;

    if (!institutionId) {
      return NextResponse.json(
        { error: 'institutionId es requerido' },
        { status: 400 }
      );
    }

    const user = session.user as any;
    const userDni = user.dni;

    if (!userDni) {
      return NextResponse.json(
        { error: 'Usuario sin DNI registrado' },
        { status: 400 }
      );
    }

    // VALIDACIÓN DE SEGURIDAD: Verificar que el usuario pertenece a esa institución
    const staffRecord = await db.query.staff.findFirst({
      where: and(
        eq(staff.dni, userDni),
        eq(staff.institutionId, institutionId)
      ),
    });

    if (!staffRecord) {
      console.error('[Set Active Institution] User does not belong to institution:', {
        userId: user.id,
        institutionId,
      });
      return NextResponse.json(
        { error: 'No tienes acceso a esta institución' },
        { status: 403 }
      );
    }

    console.log('[Set Active Institution] Validated access for user:', user.id, 'to institution:', institutionId);

    // Actualizar institutionId en la tabla users
    await db
      .update(users)
      .set({
        institutionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log('[Set Active Institution] Updated users table');

    // Actualizar activeInstitutionId en la sesión actual
    await db
      .update(sessions)
      .set({
        activeInstitutionId: institutionId,
        updatedAt: new Date(),
      })
      .where(eq(sessions.userId, user.id));

    console.log('[Set Active Institution] Updated sessions table');

    // Better Auth maneja las cookies automáticamente con nextCookies plugin
    // La sesión se actualizará en la próxima petición

    return NextResponse.json({
      success: true,
      institutionId,
    });
  } catch (error) {
    console.error('[Set Active Institution] Error:', error);
    return NextResponse.json(
      { error: 'Error al cambiar de institución' },
      { status: 500 }
    );
  }
}
