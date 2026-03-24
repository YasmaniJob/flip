import { toast } from 'sonner';
import { ApiError } from './api-client';

/**
 * Handles API errors and displays user-friendly messages
 */
export function handleApiError(error: unknown, context?: string): void {
    console.error('[Error Handler]', context || 'API Error:', error);

    if (error instanceof ApiError) {
        // Show user-friendly message
        toast.error(error.message, {
            description: context ? `Contexto: ${context}` : undefined,
            duration: 5000,
        });

        // Log technical details for debugging
        if (process.env.NODE_ENV === 'development') {
            console.error('[API Error Details]', {
                status: error.status,
                endpoint: error.endpoint,
                details: error.details,
            });
        }

        // Handle specific status codes
        if (error.status === 401) {
            // Session expired - redirect to login after a delay
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        }

        return;
    }

    // Handle other types of errors
    if (error instanceof Error) {
        toast.error('Error inesperado', {
            description: error.message,
            duration: 5000,
        });
        return;
    }

    // Unknown error
    toast.error('Ocurrió un error inesperado', {
        description: 'Por favor, intenta nuevamente o contacta al soporte.',
        duration: 5000,
    });
}

/**
 * Shows a success message
 */
export function showSuccess(message: string, description?: string): void {
    toast.success(message, {
        description,
        duration: 3000,
    });
}

/**
 * Shows a loading toast that can be updated
 */
export function showLoading(message: string): string | number {
    return toast.loading(message);
}

/**
 * Updates a loading toast to success
 */
export function updateToSuccess(toastId: string | number, message: string, description?: string): void {
    toast.success(message, {
        id: toastId,
        description,
        duration: 3000,
    });
}

/**
 * Updates a loading toast to error
 */
export function updateToError(toastId: string | number, error: unknown, context?: string): void {
    if (error instanceof ApiError) {
        toast.error(error.message, {
            id: toastId,
            description: context,
            duration: 5000,
        });
    } else if (error instanceof Error) {
        toast.error('Error inesperado', {
            id: toastId,
            description: error.message,
            duration: 5000,
        });
    } else {
        toast.error('Ocurrió un error inesperado', {
            id: toastId,
            duration: 5000,
        });
    }
}
