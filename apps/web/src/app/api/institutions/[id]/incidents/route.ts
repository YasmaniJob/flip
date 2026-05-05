import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createIncidentSchema, listIncidentsQuerySchema } from '@/features/incidents/schemas';
import { IncidentService, IncidentPermissionError } from '@/features/incidents/services/incident-service';

// POST /api/institutions/[id]/incidents - Create incident
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: institutionId } = await params;
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.institutionId !== institutionId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = createIncidentSchema.parse(body);

    const incident = await IncidentService.create(
      institutionId,
      validatedData,
      session.user as any,
    );

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    if (error instanceof IncidentPermissionError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Datos inválidos', details: error }, { status: 400 });
    }
    console.error('Error creating incident:', error);
    return NextResponse.json({ error: 'Error al crear la incidencia' }, { status: 500 });
  }
}

// GET /api/institutions/[id]/incidents - List incidents
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: institutionId } = await params;
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.institutionId !== institutionId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const query = listIncidentsQuerySchema.parse(searchParams);

    const result = await IncidentService.list(institutionId, query);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Parámetros inválidos', details: error }, { status: 400 });
    }
    console.error('Error listing incidents:', error);
    return NextResponse.json({ error: 'Error al listar incidencias' }, { status: 500 });
  }
}
