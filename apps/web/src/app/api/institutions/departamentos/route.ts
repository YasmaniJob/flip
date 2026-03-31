import { getCachedDepartamentos } from '@/features/institutions/lib/geography-cache';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/institutions/departamentos - Get unique departments
export async function GET() {
  try {
    const departamentos = await getCachedDepartamentos();
    return successResponse(departamentos);
  } catch (error) {
    return errorResponse(error);
  }
}
