/**
 * Base error class for application errors
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 401 Unauthorized - User is not authenticated
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * 403 Forbidden - User doesn't have permission
 */
export class ForbiddenError extends AppError {
  constructor(message = 'No tienes permisos para esta acción') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * 404 Not Found - Resource not found
 */
export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * 400 Bad Request - Validation error
 */
export class ValidationError extends AppError {
  constructor(
    message = 'Datos inválidos',
    public errors?: Array<{
      path: (string | number)[];
      message: string;
      code?: string;
    }>
  ) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}
