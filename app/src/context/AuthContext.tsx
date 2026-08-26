import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, saveToken, loadToken, clearToken, UserSummary } from "../api/client";
import { registerForPushNotifications } from "../notifications";

interface AuthContextValue {
  user: UserSummary | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string, emoji: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const token = await loadToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
      registerForPushNotifications();
    } catch {
      await clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const signup = async (email: string, password: string, displayName: string, emoji: string) => {
    const res = await api.post("/auth/signup", { email, password, displayName, emoji });
    await saveToken(res.data.token);
    setUser(res.data.user);
    registerForPushNotifications();
  };

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    await saveToken(res.data.token);
    setUser(res.data.user);
    registerForPushNotifications();
  };

  const logout = async () => {
    try {
      await clearToken();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
