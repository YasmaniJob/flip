import { useSession } from "./auth-client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

type RequestConfig = RequestInit & {
    token?: string;
};

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


        const response = await fetch(url, {
            ...config,
            headers,
            credentials: 'include', // Important for CORS cookies
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
        }

        return data as T;
    };

    return {
        get: <T>(endpoint: string, config?: RequestConfig) => request<T>(endpoint, { ...config, method: 'GET' }),
        post: <T>(endpoint: string, body: unknown, config?: RequestConfig) => request<T>(endpoint, { ...config, method: 'POST', body: JSON.stringify(body) }),
        put: <T>(endpoint: string, body: unknown, config?: RequestConfig) => request<T>(endpoint, { ...config, method: 'PUT', body: JSON.stringify(body) }),
        delete: <T>(endpoint: string, config?: RequestConfig) => request<T>(endpoint, { ...config, method: 'DELETE' }),
        patch: <T>(endpoint: string, body: unknown, config?: RequestConfig) => request<T>(endpoint, { ...config, method: 'PATCH', body: JSON.stringify(body) }),
    };
}
