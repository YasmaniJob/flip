import { useSession } from "./auth-client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

type RequestConfig = RequestInit & {
    token?: string;
};

// Custom error class for API errors
export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public statusText: string,
        public endpoint: string,
        public details?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// User-friendly error messages
const ERROR_MESSAGES: Record<number, string> = {
    400: 'Los datos enviados no son válidos. Por favor, verifica la información.',
    401: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    403: 'No tienes permisos para realizar esta acción.',
    404: 'El recurso solicitado no existe.',
    409: 'Ya existe un registro con estos datos.',
    422: 'Los datos proporcionados no cumplen con los requisitos.',
    429: 'Demasiadas solicitudes. Por favor, espera un momento.',
    500: 'Error en el servidor. Estamos trabajando para solucionarlo.',
    502: 'El servidor no está disponible temporalmente.',
    503: 'El servicio no está disponible. Intenta más tarde.',
};

function getUserFriendlyMessage(status: number, serverMessage?: string): string {
    // If server provides a clear message, use it
    if (serverMessage && serverMessage.length < 100 && !serverMessage.includes('Error')) {
        return serverMessage;
    }
    
    // Otherwise use our predefined messages
    return ERROR_MESSAGES[status] || 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
}

export function useApiClient() {
    const { data: session } = useSession();
    const token = session?.session?.token;

    const request = async <T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> => {
        const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(config.headers as Record<string, string>),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...config,
                headers,
                credentials: 'include',
            });

            let data: any = {};
            const contentType = response.headers.get('content-type');
            
            if (contentType?.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (e) {
                    console.warn('[API Client] Failed to parse JSON response:', e);
                }
            }

            if (!response.ok) {
                const userMessage = getUserFriendlyMessage(response.status, data.message || data.error);
                
                throw new ApiError(
                    userMessage,
                    response.status,
                    response.statusText,
                    endpoint,
                    data
                );
            }

            return data as T;
        } catch (error) {
            // Network errors or other fetch failures
            if (error instanceof ApiError) {
                throw error;
            }
            
            // Network error or timeout
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new ApiError(
                    'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
                    0,
                    'Network Error',
                    endpoint
                );
            }
            
            // Unknown error
            throw new ApiError(
                'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
                0,
                'Unknown Error',
                endpoint,
                error
            );
        }
    };

    return {
        get: <T>(endpoint: string, config?: RequestConfig) => request<T>(endpoint, { ...config, method: 'GET' }),
        post: <T>(endpoint: string, body: unknown, config?: RequestConfig) => request<T>(endpoint, { ...config, method: 'POST', body: JSON.stringify(body) }),
        put: <T>(endpoint: string, body: unknown, config?: RequestConfig) => request<T>(endpoint, { ...config, method: 'PUT', body: JSON.stringify(body) }),
        delete: <T>(endpoint: string, config?: RequestConfig) => request<T>(endpoint, { ...config, method: 'DELETE' }),
        patch: <T>(endpoint: string, body: unknown, config?: RequestConfig) => request<T>(endpoint, { ...config, method: 'PATCH', body: JSON.stringify(body) }),
    };
}
