import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type UserSettings = {
  defaultClassroomId?: string;
  defaultShift?: 'morning' | 'afternoon';
  language?: string;
  privacy?: {
    newFriend?: boolean;
    channelFriend?: boolean;
    authenticatorApp?: boolean;
  };
};

export async function GET(request: NextRequest) {
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

    const user = session.user as any;

    // Obtener configuraciones del usuario desde la BD
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Retornar las configuraciones desde el campo JSON
    const settings: UserSettings = (userRecord.settings as any) || {
      language: 'es',
      privacy: {
        newFriend: true,
        channelFriend: true,
        authenticatorApp: false,
      },
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('[User Settings GET] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuraciones' },
      { status: 500 }
    );
  }
}

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

    const user = session.user as any;
    const body: UserSettings = await request.json();

    console.log('[User Settings POST] Updating settings for user:', user.id, body);

    // Actualizar configuraciones del usuario en el campo JSON
    await db
      .update(users)
      .set({
        settings: body as any,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log('[User Settings POST] Settings updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Configuraciones actualizadas correctamente',
    });
  } catch (error) {
    console.error('[User Settings POST] Error:', error);
    return NextResponse.json(
      { error: 'Error al guardar configuraciones' },
      { status: 500 }
    );
  }
}
