const API_BASE = (import.meta as any).env.VITE_API_BASE || "http://localhost:8000";

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            throw new ApiError("Authentication required", res.status);
        }
        const text = await res.text();
        try {
            const json = JSON.parse(text);
            throw new ApiError(json.detail || json.message || "API Error", res.status);
        } catch (e) {
            if (e instanceof ApiError) throw e;
            throw new ApiError(text || `HTTP Error ${res.status}`, res.status);
        }
    }
    // Handle empty responses
    if (res.status === 204) return {} as T;

    // Check content type before parsing json
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return res.json();
    }
    return {} as T;
}

export const api = {
    get: async <T>(path: string, params?: Record<string, any>) => {
        // Determine full URL. If path starts with http, use it, else append to API_BASE
        const fullUrl = path.startsWith('http') ? path : `${API_BASE}${path}`;
        const url = new URL(fullUrl);

        if (params) {
            Object.entries(params).forEach(([key, val]) => {
                if (val !== undefined && val !== null) {
                    url.searchParams.append(key, String(val));
                }
            });
        }
        const res = await fetch(url.toString(), { credentials: "include" });
        return handleResponse<T>(res);
    },

    post: async <T>(path: string, body: any, isMultipart = false) => {
        const fullUrl = path.startsWith('http') ? path : `${API_BASE}${path}`;
        const headers: HeadersInit = isMultipart ? {} : { 'Content-Type': 'application/json' };

        // For Multipart, do not set Content-Type header, let browser set boundary

        const res = await fetch(fullUrl, {
            method: 'POST',
            headers: isMultipart ? undefined : headers,
            body: isMultipart ? body : JSON.stringify(body),
            credentials: "include"
        });
        return handleResponse<T>(res);
    },

    patch: async <T>(path: string, body: any) => {
        const fullUrl = path.startsWith('http') ? path : `${API_BASE}${path}`;
        const res = await fetch(fullUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            credentials: "include"
        });
        return handleResponse<T>(res);
    }
};
