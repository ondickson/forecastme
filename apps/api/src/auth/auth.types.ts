export type TokenType = 'access' | 'refresh';

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  email: string;
  role: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  type: 'refresh';
}

export interface AuthenticationContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticationTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticationResult {
  user: PublicUser;
  tokens: AuthenticationTokens;
}
