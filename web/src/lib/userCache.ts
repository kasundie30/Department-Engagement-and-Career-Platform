import { api } from './axios';

export interface UserInfo {
  name: string;
  avatar: string;
}

const cache = new Map<string, UserInfo>();
const inFlight = new Map<string, Promise<UserInfo>>();

export async function resolveUser(auth0Id: string): Promise<UserInfo> {
  if (!auth0Id) return { name: 'Unknown', avatar: '' };

  const cached = cache.get(auth0Id);
  if (cached) return cached;

  // Deduplicate concurrent requests for same ID
  const existing = inFlight.get(auth0Id);
  if (existing) return existing;

  const promise = api
    .get(`/api/v1/user-service/users/by-auth0/${encodeURIComponent(auth0Id)}`)
    .then((res) => {
      const info: UserInfo = {
        name: res.data?.name || 'Unknown',
        avatar: res.data?.avatar || '',
      };
      cache.set(auth0Id, info);
      return info;
    })
    .catch(() => {
      const fallback: UserInfo = { name: auth0Id.substring(0, 8) + '…', avatar: '' };
      cache.set(auth0Id, fallback);
      return fallback;
    })
    .finally(() => {
      inFlight.delete(auth0Id);
    });

  inFlight.set(auth0Id, promise);
  return promise;
}

export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] || '?').toUpperCase();
}

export function searchUsers(q: string): Promise<{ auth0Id: string; name: string; email: string; avatar: string }[]> {
  if (!q || q.trim().length < 2) return Promise.resolve([]);
  return api
    .get('/api/v1/user-service/users/search', { params: { q: q.trim() } })
    .then((res) => res.data || [])
    .catch(() => []);
}
