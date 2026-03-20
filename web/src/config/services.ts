/**
 * Centralized service URL configuration.
 *
 * Set these VITE_* env variables in your Vercel/local .env.local to point
 * to your deployed Render service URLs. Local fallbacks use the default dev ports.
 *
 * To update: only change this file (or the env vars) — no component changes needed.
 */
export const SERVICE_URLS: Record<string, string> = {
    'user-service': import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001',
    'feed-service': import.meta.env.VITE_FEED_SERVICE_URL || 'http://localhost:3002',
    'job-service': import.meta.env.VITE_JOB_SERVICE_URL || 'http://localhost:3003',
    'event-service': import.meta.env.VITE_EVENT_SERVICE_URL || 'http://localhost:3004',
    'notification-service': import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
    'research-service': import.meta.env.VITE_RESEARCH_SERVICE_URL || 'http://localhost:3007',
    'analytics-service': import.meta.env.VITE_ANALYTICS_SERVICE_URL || 'http://localhost:3008',
    'messaging-service': import.meta.env.VITE_MESSAGING_SERVICE_URL || 'http://localhost:3000',
};
