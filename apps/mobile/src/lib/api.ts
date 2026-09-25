
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "./auth";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

async function raw(path: string, init: RequestInit, token?: string) {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type") && init.body) headers.set("content-type", "application/json");
  if (token) headers.set("authorization", "Bearer " + token);
  return fetch(API_URL + path, { ...init, headers });
}

export async function api<T>(path: string, init: RequestInit & { auth?: boolean; retry?: boolean } = {}): Promise<T> {
  const auth = init.auth !== false;
  const token = auth ? await getAccessToken() : undefined;
  const retry = init.retry !== false;
  const request: RequestInit = { method: init.method, headers: init.headers, body: init.body };
  let response = await raw(path, request, token ?? undefined);

  if (response.status === 401 && auth && retry) {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      const refresh = await raw("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) });
      if (refresh.ok) {
        const data = await refresh.json() as { accessToken: string; refreshToken: string };
        await saveTokens(data.accessToken, data.refreshToken);
        response = await raw(path, request, data.accessToken);
      } else {
        await clearTokens();
      }
    }
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? body?.error ?? "Request failed");
  return body as T;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  locale: string;
  roles: string[];
}
export interface Listing {
  id: string;
  listingType: string;
  priceMinor: number;
  currency: string;
  propertyId: string;
  status: string;
}
export interface Property {
  id: string;
  title: string;
  description: string;
  district: string;
  province: string;
  sector?: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  verificationStatus: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  media: Array<{ id?: string; kind: string; storageKey?: string; url?: string }>;
  listings?: Listing[];
}
export interface SearchItem {
  score: number;
  distanceMeters?: number;
  listing: Listing;
  property: Property;
}
export async function login(identifier: string, password: string) {
  return api<{ accessToken: string; refreshToken: string; user: User }>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ identifier, password }),
  });
}
