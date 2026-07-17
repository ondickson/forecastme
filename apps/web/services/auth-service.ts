import { apiRequest } from '@/lib/api/client';
import type {
  AuthenticatedUser,
  AuthenticationResult,
  AuthenticationTokens,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
} from '@/types/auth';

const AUTH_PATH = '/auth';

let activeRefreshRequest: Promise<AuthenticationTokens> | null = null;

export function register(request: RegisterRequest): Promise<AuthenticationResult> {
  return apiRequest<AuthenticationResult>(`${AUTH_PATH}/register`, {
    method: 'POST',
    body: request,
  });
}

export function login(request: LoginRequest): Promise<AuthenticationResult> {
  return apiRequest<AuthenticationResult>(`${AUTH_PATH}/login`, {
    method: 'POST',
    body: request,
  });
}

export function refresh(request: RefreshTokenRequest): Promise<AuthenticationTokens> {
  if (activeRefreshRequest) {
    return activeRefreshRequest;
  }

  activeRefreshRequest = apiRequest<AuthenticationTokens>(`${AUTH_PATH}/refresh`, {
    method: 'POST',
    body: request,
  }).finally(() => {
    activeRefreshRequest = null;
  });

  return activeRefreshRequest;
}

export function logout(request: LogoutRequest): Promise<void> {
  return apiRequest<void>(`${AUTH_PATH}/logout`, {
    method: 'POST',
    body: request,
  });
}

export function getCurrentUser(accessToken: string): Promise<AuthenticatedUser> {
  return apiRequest<AuthenticatedUser>(`${AUTH_PATH}/me`, {
    method: 'GET',
    accessToken,
  });
}
