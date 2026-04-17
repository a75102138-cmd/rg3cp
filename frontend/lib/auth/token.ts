import { AUTH_COOKIE } from "./constants";

export { AUTH_COOKIE };

export function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${AUTH_COOKIE}=([^;]*)`));
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

export function setAccessToken(token: string): void {
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearAccessToken(): void {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}
