import { NextRequest } from 'next/server';
import { turso } from '@/lib/db/turso';
import { educationInstitutionsMinedu } from '@/lib/db/schema-turso';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

// GET /api/institutions/departamentos - Get unique departments (PUBLIC)
export async function GET(request: NextRequest) {
  try {
    // Cache departamentos for 1 hour since they don't change
    const getDepartamentos = unstable_cache(
      async () => {
        const results = await turso
          .selectDistinct({
            departamento: educationInstitutionsMinedu.departamento,
          })
          .from(educationInstitutionsMinedu)
          .where(sql`${educationInstitutionsMinedu.departamento} IS NOT NULL`)
          .orderBy(educationInstitutionsMinedu.departamento);

        return results.map((r) => r.departamento).filter(Boolean);
      },
      ['departamentos'],
      { revalidate: 3600, tags: ['departamentos'] } // 1 hour
    );

    const departamentos = await getDepartamentos();

    return successResponse(departamentos);
  } catch (error) {
    return errorResponse(error);
  }
}
