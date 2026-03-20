import axios from 'axios';
import { SERVICE_URLS } from '../config/services';

/**
 * Axios instance with automatic service URL resolution.
 *
 * Components continue to use the same API call pattern:
 *   api.get('/api/v1/user-service/users/me')
 *
 * This interceptor detects the service name in the path and rewrites the
 * request to the correct Render service URL from services.ts:
 *   /api/v1/user-service/users/me
 *   → https://<user-service>.onrender.com/api/v1/users/me
 *
 * This means NO component code needs to change.
 */
export const api = axios.create({
    baseURL: '',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token getter — set by Auth0 after init (avoids circular import with AuthContext)
let _getToken: (() => Promise<string | undefined>) | null = null;
export function setTokenGetter(fn: () => Promise<string | undefined>) {
    _getToken = fn;
}

/** Rewrite /api/v1/{service-name}/... → {serviceBaseUrl}/api/v1/... */
function resolveUrl(path: string): string | null {
    // Match: /api/v1/{service-name}/{rest}
    const match = path.match(/^\/api\/v1\/([\w-]+)\/(.*)/);
    if (!match) return null;
    const [, serviceName, rest] = match;
    const baseUrl = SERVICE_URLS[serviceName];
    if (!baseUrl) return null;
    return `${baseUrl}/api/v1/${rest}`;
}

// Request interceptor: resolve service URL + attach Bearer token
api.interceptors.request.use(
    async (config) => {
        // Resolve the absolute URL if the path starts with /api/v1/{service-name}/
        if (config.url && config.url.startsWith('/api/v1/')) {
            const resolved = resolveUrl(config.url);
            if (resolved) {
                config.url = resolved;
            }
        }

        // Attach Auth0 Bearer token
        if (_getToken) {
            try {
                const token = await _getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (err) {
                console.warn('[axios] Could not get access token', err);
            }
        }

        return config;
    },
    (error) => Promise.reject(error),
);
