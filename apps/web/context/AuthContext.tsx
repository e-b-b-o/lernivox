'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, ApiError, onTokenRefreshed, onSessionExpired } from '../lib/api';
import type {
  LoginRequestDto,
  RegisterRequestDto,
  UserDto,
} from '@lernivox/contracts';

interface AuthContextValue {
  user: UserDto | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequestDto) => Promise<void>;
  register: (data: RegisterRequestDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from HttpOnly cookie on application load
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await api.auth.refresh();
      setUser(response.user);
      setAccessToken(response.accessToken);
      return true;
    } catch {
      setUser(null);
      setAccessToken(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  // Synchronize state when centralized API client performs silent token refresh or detects session expiry
  useEffect(() => {
    const unsubRefreshed = onTokenRefreshed((newToken, newUser) => {
      setAccessToken(newToken);
      if (newUser) {
        setUser(newUser);
      }
    });

    const unsubExpired = onSessionExpired(() => {
      setUser(null);
      setAccessToken(null);
    });

    return () => {
      unsubRefreshed();
      unsubExpired();
    };
  }, []);

  const login = useCallback(
    async (data: LoginRequestDto) => {
      setIsLoading(true);
      try {
        const response = await api.auth.login(data);
        setUser(response.user);
        setAccessToken(response.accessToken);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const register = useCallback(
    async (data: RegisterRequestDto) => {
      setIsLoading(true);
      try {
        const response = await api.auth.register(data);
        setUser(response.user);
        setAccessToken(response.accessToken);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore network errors on logout
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: Boolean(user && accessToken),
      login,
      register,
      logout,
      refreshSession,
    }),
    [user, accessToken, isLoading, login, register, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
