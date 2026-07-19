'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();

  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status !== 'unauthenticated') {
      return;
    }

    const destination =
      pathname && pathname !== '/' ? `/login?next=${encodeURIComponent(pathname)}` : '/login';

    router.replace(destination);
  }, [pathname, router, status]);

  if (status !== 'authenticated') {
    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-background"
        role="status"
        aria-live="polite"
        aria-label="Checking authentication"
      >
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <LoaderCircle
            className="size-6 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          <p className="text-sm">Checking your session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
