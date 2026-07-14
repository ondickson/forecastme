export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
  email: string;
  role: string;
}
