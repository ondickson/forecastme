// components/auth/register-form.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registrationSchema, type RegistrationFormValues } from '@/lib/validation/auth';
import { useAuthStore } from '@/store/auth-store';

function resolveDestination(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }

  return value;
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const registerUser = useAuthStore((state) => state.register);
  const status = useAuthStore((state) => state.status);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const apiError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const destination = resolveDestination(searchParams.get('next'));
  const loginHref =
    destination === '/' ? '/login' : `/login?next=${encodeURIComponent(destination)}`;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
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
      await registerUser({
        displayName: values.displayName,
        email: values.email,
        password: values.password,
      });

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
    <main className="flex min-h-dvh items-center justify-center bg-white">
      <Card className="w-full rounded-[2rem] border border-gray-200 bg-white shadow-lg shadow-slate-900/5">
        <CardHeader className="space-y-3 border-b border-gray-200 bg-slate-50 px-8 py-8">
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.35em] text-indigo-700">
              Create account
            </p>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Create your ForecastMe account
            </CardTitle>
            <CardDescription className="text-base leading-6 text-slate-500">
              Join the next generation of predictive intelligence.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 py-8">
          <form className="space-y-6" onSubmit={onSubmit} noValidate aria-busy={isSubmitting}>
            {apiError ? (
              <Alert variant="destructive">
                <AlertCircle aria-hidden="true" />
                <AlertTitle>Unable to create account</AlertTitle>
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-base">
                  Full name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.displayName)}
                  aria-describedby={errors.displayName ? 'display-name-error' : undefined}
                  className="border-gray-300 bg-gray-50 text-base text-slate-900 placeholder:text-slate-400"
                  {...register('displayName', {
                    onChange: clearError,
                  })}
                />
                {errors.displayName ? (
                  <p id="display-name-error" className="text-sm text-destructive" role="alert">
                    {errors.displayName.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className="border-gray-300 bg-gray-50 text-base text-slate-900 placeholder:text-slate-400"
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

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="border-gray-300 bg-gray-50 pr-10 text-base text-slate-900 placeholder:text-slate-400"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={
                        errors.password ? 'registration-password-error' : 'password-requirement'
                      }
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
                    <p
                      id="registration-password-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.password.message}
                    </p>
                  ) : (
                    <p id="password-requirement" className="text-sm text-slate-500">
                      Use at least 12 characters.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-base">
                    Confirm password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmation ? 'text' : 'password'}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="border-gray-300 bg-gray-50 pr-10 text-base text-slate-900 placeholder:text-slate-400"
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={
                        errors.confirmPassword ? 'confirm-password-error' : undefined
                      }
                      {...register('confirmPassword', {
                        onChange: clearError,
                      })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-slate-500 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                      onClick={() => setShowConfirmation((visible) => !visible)}
                      aria-label={
                        showConfirmation
                          ? 'Hide password confirmation'
                          : 'Show password confirmation'
                      }
                      disabled={isSubmitting}
                    >
                      {showConfirmation ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword ? (
                    <p
                      id="confirm-password-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-indigo-700 text-base text-white hover:bg-indigo-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>

            <p className="text-center text-base text-slate-500">
              Already have an account?{' '}
              <Link
                href={loginHref}
                className="font-medium text-indigo-700 underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
