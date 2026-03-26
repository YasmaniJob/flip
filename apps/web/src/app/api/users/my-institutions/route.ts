import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

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
    const userEmail = user.email;

    // Buscar todas las instituciones donde trabaja este usuario
    // Usamos una sola query con OR y aprovechamos los nuevos índices globales
    const staffRecords = await db.query.staff.findMany({
      where: (staff, { or, eq }) => {
        const conditions = [];
        if (userDni) conditions.push(eq(staff.dni, userDni));
        if (userEmail) conditions.push(eq(staff.email, userEmail));
        return conditions.length > 0 ? or(...conditions) : undefined;
      },
      with: {
        institution: true,
      },
    });

    // Si aún no hay resultados, retornar array vacío (no es error)
    if (staffRecords.length === 0) {
      console.log('[My Institutions] No staff records found for user:', user.id);
      return NextResponse.json({
        institutions: [],
        activeInstitutionId: user.institutionId || null,
      });
    }

    const institutions = staffRecords.map((s) => ({
      id: s.institutionId,
      name: s.institution.name,
      nivel: s.institution.nivel,
      logo: (s.institution.settings as any)?.logo,
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
