import { NextRequest } from 'next/server';
import { turso } from '@/lib/db/turso';
import { educationInstitutionsMinedu } from '@/lib/db/schema-turso';
import { validateQuery } from '@/lib/validations/helpers';
import { searchQuerySchema } from '@/lib/validations/schemas/institutions';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { like, and, or, sql } from 'drizzle-orm';

// GET /api/institutions/search - Search MINEDU institutions (PUBLIC)
export async function GET(request: NextRequest) {
  try {
    const query = validateQuery(searchQuerySchema, request.nextUrl.searchParams);

    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const offset = parseInt(query.offset || '0', 10);

    const conditions = [];

    // Multi-word search: each word must match name OR code
    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      const terms = q.split(/\s+/).filter((t) => t.length > 0);

      terms.forEach((term) => {
        conditions.push(
          or(
            like(educationInstitutionsMinedu.nombre, `%${term}%`),
            like(educationInstitutionsMinedu.codigoModular, `%${term}%`)
          )
        );
      });
    }

    // Filter by nivel
    if (query.nivel && query.nivel.trim()) {
      conditions.push(like(educationInstitutionsMinedu.nivel, query.nivel.trim()));
    }

    // Filter by departamento
    if (query.departamento && query.departamento.trim()) {
      conditions.push(
        like(educationInstitutionsMinedu.departamento, query.departamento.trim())
      );
    }

    // Filter by provincia
    if (query.provincia && query.provincia.trim()) {
      conditions.push(
        like(educationInstitutionsMinedu.provincia, query.provincia.trim())
      );
    }

    // Filter by distrito
    if (query.distrito && query.distrito.trim()) {
      conditions.push(
        like(educationInstitutionsMinedu.distrito, query.distrito.trim())
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await turso
      .select({ count: sql<number>`count(*)` })
      .from(educationInstitutionsMinedu)
      .where(whereClause);

    const total = Number(countResult?.count || 0);

    // Get items
    const items = await turso
      .select({
        codigoModular: educationInstitutionsMinedu.codigoModular,
        nombre: educationInstitutionsMinedu.nombre,
        nivel: educationInstitutionsMinedu.nivel,
        tipoGestion: educationInstitutionsMinedu.tipoGestion,
        departamento: educationInstitutionsMinedu.departamento,
        provincia: educationInstitutionsMinedu.provincia,
        distrito: educationInstitutionsMinedu.distrito,
        direccion: educationInstitutionsMinedu.direccion,
      })
      .from(educationInstitutionsMinedu)
      .where(whereClause)
      .orderBy(educationInstitutionsMinedu.nombre)
      .limit(limit)
      .offset(offset);

    return successResponse({ items, total });
  } catch (error) {
    return errorResponse(error);
  }
}
