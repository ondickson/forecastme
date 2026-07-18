'use client';

import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { useAuthStore } from '@/store/auth-store';

function authenticationRequiredError(): ApiError {
  return new ApiError('You must be logged in to perform this request.', {
    status: 401,
    code: 'AUTHENTICATION_REQUIRED',
  });
}

function sessionExpiredError(): ApiError {
  return new ApiError('Your session has expired. Please log in again.', {
    status: 401,
    code: 'SESSION_EXPIRED',
  });
}

export async function authenticatedApiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const authentication = useAuthStore.getState();

  if (authentication.status !== 'authenticated' || !authentication.accessToken) {
    throw authenticationRequiredError();
  }

  try {
    return await apiRequest<T>(path, {
      ...options,
      accessToken: authentication.accessToken,
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }
  }

  let refreshedAccessToken: string;

  try {
    refreshedAccessToken = await useAuthStore.getState().refreshAccessToken();
  } catch {
    throw sessionExpiredError();
  }

  return apiRequest<T>(path, {
    ...options,
    accessToken: refreshedAccessToken,
  });
}
