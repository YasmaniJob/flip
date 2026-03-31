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

    // Multi-word search
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

    // Filters
    if (query.nivel?.trim()) conditions.push(like(educationInstitutionsMinedu.nivel, query.nivel.trim()));
    if (query.departamento?.trim()) conditions.push(like(educationInstitutionsMinedu.departamento, query.departamento.trim()));
    if (query.provincia?.trim()) conditions.push(like(educationInstitutionsMinedu.provincia, query.provincia.trim()));
    if (query.distrito?.trim()) conditions.push(like(educationInstitutionsMinedu.distrito, query.distrito.trim()));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    /**
     * 🧠 Single-Query Execution with Window Function
     * 'count(*) OVER()' gets the total matching rows before limit/offset.
     * This avoids one extra database hit to Turso per search keystroke.
     */
    const itemsWithCount = await turso
      .select({
        codigoModular: educationInstitutionsMinedu.codigoModular,
        nombre: educationInstitutionsMinedu.nombre,
        nivel: educationInstitutionsMinedu.nivel,
        tipoGestion: educationInstitutionsMinedu.tipoGestion,
        departamento: educationInstitutionsMinedu.departamento,
        provincia: educationInstitutionsMinedu.provincia,
        distrito: educationInstitutionsMinedu.distrito,
        direccion: educationInstitutionsMinedu.direccion,
        /**
         * We cast as any because Drizzle might not have full typing for OVER() in SQLite
         * but libsql/turso supports it perfectly.
         */
        totalRecords: sql<number>`count(*) OVER()`.as('total_records'),
      })
      .from(educationInstitutionsMinedu)
      .where(whereClause)
      .orderBy(educationInstitutionsMinedu.nombre)
      .limit(limit)
      .offset(offset);

    const total = itemsWithCount.length > 0 ? Number((itemsWithCount[0] as any).total_records) : 0;
    
    // Cleanup the totalRecords field from items if strictly needed, or just map it.
    const items = itemsWithCount.map(({ totalRecords, ...item }) => item);

    return successResponse({ items, total });
  } catch (error) {
    console.error('[IE Search] Error:', error);
    return errorResponse(error);
  }
}
