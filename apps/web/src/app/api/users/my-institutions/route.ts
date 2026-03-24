import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { staff } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
    const userDni = user.dni;

    if (!userDni) {
      return NextResponse.json(
        { error: 'Usuario sin DNI registrado' },
        { status: 400 }
      );
    }

    // Buscar todas las instituciones donde trabaja este usuario
    const staffRecords = await db.query.staff.findMany({
      where: eq(staff.dni, userDni),
      with: {
        institution: true,
      },
    });

    const institutions = staffRecords.map((s) => ({
      id: s.institutionId,
      name: s.institution.name,
      nivel: s.institution.nivel,
      logo: s.institution.logo,
    }));

    return NextResponse.json({
      institutions,
      activeInstitutionId: user.institutionId,
    });
  } catch (error) {
    console.error('[My Institutions] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener instituciones' },
      { status: 500 }
    );
  }
}
