export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthenticationTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticationResult {
  user: AuthenticatedUser;
  tokens: AuthenticationTokens;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}
