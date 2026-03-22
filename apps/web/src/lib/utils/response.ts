import { NextResponse } from 'next/server';
import { AppError, ValidationError } from './errors';

/**
 * Success response helper
 * @param data - Response data
 * @param messageOrStatus - Success message (string) or HTTP status code (number)
 * @param status - HTTP status code (optional, only used if second param is a message)
 */
export function successResponse<T>(
  data: T,
  messageOrStatus?: string | number,
  status?: number
) {
  // If second param is a string, it's a message
  if (typeof messageOrStatus === 'string') {
    const statusCode = status || 200;
    return NextResponse.json(
      { success: true, data, message: messageOrStatus },
      { status: statusCode }
    );
  }

  // If second param is a number, it's a status code
  const statusCode = typeof messageOrStatus === 'number' ? messageOrStatus : 200;
  return NextResponse.json(data, { status: statusCode });
}

/**
 * Error response helper
 * Handles AppError instances and generic errors
 */
export function errorResponse(error: unknown) {
  // Handle known application errors
  if (error instanceof AppError) {
    const response: any = {
      error: error.message,
      code: error.code,
    };

    // Include validation errors if present
    if (error instanceof ValidationError && error.errors) {
      response.errors = error.errors;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Handle unknown errors
  console.error('Unexpected error:', error);
  return NextResponse.json(
    {
      error: 'Error interno del servidor',
      code: 'INTERNAL_SERVER_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Paginated response helper
 */
export function paginatedResponse<T>(
  data: T[],
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  }
) {
  return successResponse({ data, meta });
}
