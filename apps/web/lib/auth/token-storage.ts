const REFRESH_TOKEN_KEY = 'forecastme.refresh-token';

function canUseStorage(): boolean {
  return typeof window !== 'undefined';
}

export function getStoredRefreshToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeRefreshToken(refreshToken: string): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearStoredRefreshToken(): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
