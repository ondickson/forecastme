// components/auth/login-form.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginSchema, type LoginFormValues } from '@/lib/validation/auth';
import { useAuthStore } from '@/store/auth-store';

function resolveDestination(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }

  return value;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const login = useAuthStore((state) => state.login);
  const status = useAuthStore((state) => state.status);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const apiError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [showPassword, setShowPassword] = useState(false);

  const destination = resolveDestination(searchParams.get('next'));

  const registerHref =
    destination === '/' ? '/register' : `/register?next=${encodeURIComponent(destination)}`;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(destination);
    }
  }, [destination, router, status]);

  const onSubmit = handleSubmit(async (values) => {
    if (isSubmitting) {
      return;
    }

    try {
      await login(values);
      router.replace(destination);
    } catch {
      // The authentication store exposes the API error to the form.
    }
  });

  if (status === 'initializing') {
    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-white"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          Checking your session...
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-white"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          Redirecting...
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-lg shadow-slate-900/5">
          <div className="border-b border-gray-200 px-8 py-8 sm:px-10">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500">
                Welcome back
              </p>
              <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900">
                Sign in to ForecastMe
              </CardTitle>
              <CardDescription className="max-w-md text-sm text-slate-500">
                Enter your credentials to continue to your analysis workspace.
              </CardDescription>
            </div>
          </div>

          <CardContent className="px-8 py-8 sm:px-10">
            <form className="space-y-6" onSubmit={onSubmit} noValidate aria-busy={isSubmitting}>
              {apiError ? (
                <Alert variant="destructive">
                  <AlertCircle aria-hidden="true" />
                  <AlertTitle>Unable to sign in</AlertTitle>
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className="border-gray-300 bg-white"
                    {...register('email', {
                      onChange: clearError,
                    })}
                  />
                  {errors.email ? (
                    <p id="email-error" className="text-sm text-destructive" role="alert">
                      {errors.email.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      className="pr-10 border-gray-300 bg-white"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      {...register('password', {
                        onChange: clearError,
                      })}
                    />

                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-slate-500 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      disabled={isSubmitting}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {errors.password ? (
                    <p id="password-error" className="text-sm text-destructive" role="alert">
                      {errors.password.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link
                  href={registerHref}
                  className="font-medium text-indigo-600 underline-offset-4 hover:underline"
                >
                  Create one
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
