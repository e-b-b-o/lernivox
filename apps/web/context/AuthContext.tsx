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
import { clientCache } from '../lib/client-cache';
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
  updateProfile: (name: string) => Promise<UserDto>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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
      clientCache.clearAll();
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
      clientCache.clearAll();
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const updateProfile = useCallback(
    async (name: string): Promise<UserDto> => {
      if (!accessToken) throw new Error('Not authenticated.');
      const updatedUser = await api.auth.updateProfile({ name }, accessToken);
      setUser(updatedUser);
      return updatedUser;
    },
    [accessToken],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<void> => {
      if (!accessToken) throw new Error('Not authenticated.');
      const res = await api.auth.changePassword(
        { currentPassword, newPassword },
        accessToken,
      );
      if (res.accessToken) {
        setAccessToken(res.accessToken);
      }
      if (res.user) {
        setUser(res.user);
      }
    },
    [accessToken],
  );

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
      updateProfile,
      changePassword,
    }),
    [
      user,
      accessToken,
      isLoading,
      login,
      register,
      logout,
      refreshSession,
      updateProfile,
      changePassword,
    ],
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
