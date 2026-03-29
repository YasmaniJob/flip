import { NextRequest } from 'next/server';
import { turso } from '@/lib/db/turso';
import { educationInstitutionsMinedu } from '@/lib/db/schema-turso';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { ValidationError, TooManyRequestsError } from '@/lib/utils/errors';
import { sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { rateLimit } from '@/lib/rate-limit';

// GET /api/institutions/distritos - Get districts for a province (PUBLIC)
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    if (!rateLimit(`distritos-${ip}`, 30, 60 * 1000)) {
       throw new TooManyRequestsError();
    }
    const departamento = request.nextUrl.searchParams.get('departamento');
    const provincia = request.nextUrl.searchParams.get('provincia');

    if (!departamento) {
      throw new ValidationError('El parámetro departamento es requerido');
    }

    if (!provincia) {
      throw new ValidationError('El parámetro provincia es requerido');
    }

    // Cache distritos per provincia for 1 hour
    const getDistritos = unstable_cache(
      async (dept: string, prov: string) => {
        const results = await turso
          .selectDistinct({
            distrito: educationInstitutionsMinedu.distrito,
          })
          .from(educationInstitutionsMinedu)
          .where(
            sql`${educationInstitutionsMinedu.distrito} IS NOT NULL AND ${educationInstitutionsMinedu.departamento} LIKE ${dept.trim()} AND ${educationInstitutionsMinedu.provincia} LIKE ${prov.trim()}`
          )
          .orderBy(educationInstitutionsMinedu.distrito);

        return results.map((r) => r.distrito).filter(Boolean);
      },
      ['distritos', departamento, provincia],
      { revalidate: 3600, tags: ['distritos', `distritos-${departamento}-${provincia}`] } // 1 hour
    );

    const distritos = await getDistritos(departamento, provincia);

    return successResponse(distritos);
  } catch (error) {
    return errorResponse(error);
  }
}
