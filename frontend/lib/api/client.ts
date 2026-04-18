import { getAccessToken } from "@/lib/auth/token";

const DEFAULT_LOCAL_BASE = "http://localhost:3001/api";
const envApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

if (!envApiBaseUrl && process.env.NODE_ENV === "production") {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL in production");
}

export const API_BASE_URL = (envApiBaseUrl || DEFAULT_LOCAL_BASE).replace(/\/$/, "");

export function getApiBase(): string {
  return API_BASE_URL;
}

function authHeader(): HeadersInit {
  if (typeof window === "undefined") return {};
  const t = getAccessToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`API ${status}: ${body.slice(0, 200)}`);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { skipJson?: boolean },
): Promise<T> {
  const base = getApiBase();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(init?.body ? { "Content-Type": "application/json" } : {}),
    ...authHeader(),
    ...init?.headers,
  };
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();

  if (!res.ok) {
    throw new ApiError(res.status, text);
  }

  if (init?.skipJson || res.status === 204 || !text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

/** POST `multipart/form-data` (ne pas définir `Content-Type`, le navigateur ajoute le boundary). */
export async function apiFetchMultipart<T>(path: string, formData: FormData): Promise<T> {
  const base = getApiBase();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    headers: { Accept: "application/json", ...authHeader() },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new ApiError(res.status, text);
  }
  if (res.status === 204 || !text) {
    return undefined as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}
