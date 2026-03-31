import { NextRequest } from 'next/server';
import { getCachedDistritos } from '@/features/institutions/lib/geography-cache';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/institutions/distritos - Get unique districts given dept and prov
export async function GET(request: NextRequest) {
  try {
    const departamento = request.nextUrl.searchParams.get('departamento');
    const provincia = request.nextUrl.searchParams.get('provincia');
    
    if (!departamento || !provincia) return successResponse([]);
    
    const distritos = await getCachedDistritos(departamento, provincia);
    return successResponse(distritos);
  } catch (error) {
    return errorResponse(error);
  }
}
