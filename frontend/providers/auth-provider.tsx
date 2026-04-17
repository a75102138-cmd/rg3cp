"use client";

import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/resources";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/auth/token";
import type { ApiUser } from "@/types/api";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthContextValue = {
  user: ApiUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await authApi.me();
      setUser(u);
    } catch (err) {
      // Keep session on transient backend/network failures.
      // Only clear token when backend explicitly says unauthorized.
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        clearAccessToken();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
    window.location.href = "/login";
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, logout }),
    [user, loading, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

/** Connexion : stocke le JWT puis charge le profil. */
export async function loginWithPassword(email: string, password: string): Promise<ApiUser> {
  const { accessToken, user } = await authApi.login({ email, password });
  setAccessToken(accessToken);
  return user;
}

export async function registerWithPassword(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<ApiUser> {
  const { accessToken, user } = await authApi.register(input);
  setAccessToken(accessToken);
  return user;
}
