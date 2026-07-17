'use client';

import { create } from 'zustand';
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  refresh as refreshRequest,
  register as registerRequest,
} from '@/services/auth-service';
import {
  clearStoredRefreshToken,
  getStoredRefreshToken,
  storeRefreshToken,
} from '@/lib/auth/token-storage';
import type { AuthenticatedUser, LoginRequest, RegisterRequest } from '@/types/auth';

export type AuthenticationStatus = 'initializing' | 'authenticated' | 'unauthenticated';

interface AuthenticationState {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  status: AuthenticationStatus;
  isSubmitting: boolean;
  isLoggingOut: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

function clearSessionState(): Pick<
  AuthenticationState,
  'user' | 'accessToken' | 'status' | 'error'
> {
  clearStoredRefreshToken();

  return {
    user: null,
    accessToken: null,
    status: 'unauthenticated',
    error: null,
  };
}

export const useAuthStore = create<AuthenticationState>((set) => ({
  user: null,
  accessToken: null,
  status: 'initializing',
  isSubmitting: false,
  isLoggingOut: false,
  error: null,

  initialize: async () => {
    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) {
      set({
        user: null,
        accessToken: null,
        status: 'unauthenticated',
        error: null,
      });
      return;
    }

    try {
      const tokens = await refreshRequest({ refreshToken });

      storeRefreshToken(tokens.refreshToken);

      const user = await getCurrentUser(tokens.accessToken);

      set({
        user,
        accessToken: tokens.accessToken,
        status: 'authenticated',
        error: null,
      });
    } catch {
      set(clearSessionState());
    }
  },

  login: async (request) => {
    set({ isSubmitting: true, error: null });

    try {
      const result = await loginRequest(request);

      storeRefreshToken(result.tokens.refreshToken);

      set({
        user: result.user,
        accessToken: result.tokens.accessToken,
        status: 'authenticated',
        isSubmitting: false,
        error: null,
      });
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Unable to log in. Please try again.',
      });

      throw error;
    }
  },

  register: async (request) => {
    set({ isSubmitting: true, error: null });

    try {
      const result = await registerRequest(request);

      storeRefreshToken(result.tokens.refreshToken);

      set({
        user: result.user,
        accessToken: result.tokens.accessToken,
        status: 'authenticated',
        isSubmitting: false,
        error: null,
      });
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Unable to register. Please try again.',
      });

      throw error;
    }
  },

  logout: async () => {
    const refreshToken = getStoredRefreshToken();

    set({ isLoggingOut: true, error: null });

    try {
      if (refreshToken) {
        await logoutRequest({ refreshToken });
      }
    } catch {
      // Local logout must still complete if the API is unavailable.
    } finally {
      clearStoredRefreshToken();

      set({
        user: null,
        accessToken: null,
        status: 'unauthenticated',
        isLoggingOut: false,
        isSubmitting: false,
        error: null,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
