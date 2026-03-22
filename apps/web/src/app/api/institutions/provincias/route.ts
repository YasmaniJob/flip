import { NextRequest } from 'next/server';
import { turso } from '@/lib/db/turso';
import { educationInstitutionsMinedu } from '@/lib/db/schema-turso';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { ValidationError } from '@/lib/utils/errors';
import { sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

export async function GET(request: NextRequest) {
  try {
    const departamento = request.nextUrl.searchParams.get('departamento');

    if (!departamento) {
      throw new ValidationError('El parametro departamento es requerido');
    }

    const getProvincias = unstable_cache(
      async (dept: string) => {
        const results = await turso
          .selectDistinct({
            provincia: educationInstitutionsMinedu.provincia,
          })
          .from(educationInstitutionsMinedu)
          .where(
            sql`${educationInstitutionsMinedu.provincia} IS NOT NULL AND ${educationInstitutionsMinedu.departamento} LIKE ${dept.trim()}`
          )
          .orderBy(educationInstitutionsMinedu.provincia);

        return results.map((r) => r.provincia).filter(Boolean);
      },
      ['provincias', departamento],
      { revalidate: 3600, tags: ['provincias', `provincias-${departamento}`] }
    );

    const provincias = await getProvincias(departamento);

    return successResponse(provincias);
  } catch (error) {
    return errorResponse(error);
  }
}