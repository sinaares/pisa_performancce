"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import React from "react";
import { api, setToken, getToken } from "./api";
import type { AuthTokens, TeacherProfile } from "./types";

interface AuthState {
  token: string | null;
  user: TeacherProfile | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
  });

  // On mount, check if we have a token in sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("token");
    if (stored) {
      setToken(stored);
      api
        .get<TeacherProfile>("/api/auth/me")
        .then((user) => setState({ token: stored, user, isLoading: false }))
        .catch(() => {
          sessionStorage.removeItem("token");
          setToken(null);
          setState({ token: null, user: null, isLoading: false });
        });
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<AuthTokens>("/api/auth/login", {
      email,
      password,
    });
    setToken(data.access_token);
    sessionStorage.setItem("token", data.access_token);
    const user = await api.get<TeacherProfile>("/api/auth/me");
    setState({ token: data.access_token, user, isLoading: false });
  }, []);

  const signup = useCallback(
    async (email: string, password: string, displayName: string) => {
      const data = await api.post<AuthTokens & { id: string }>("/api/auth/signup", {
        email,
        password,
        display_name: displayName,
      });
      if (data.access_token) {
        setToken(data.access_token);
        sessionStorage.setItem("token", data.access_token);
        const user = await api.get<TeacherProfile>("/api/auth/me");
        setState({ token: data.access_token, user, isLoading: false });
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    sessionStorage.removeItem("token");
    setState({ token: null, user: null, isLoading: false });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    signup,
    logout,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
