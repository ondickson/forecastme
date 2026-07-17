import Link from 'next/link';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4 sm:p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Analysis History</CardTitle>
            <CardDescription>Saved analyses and previous results will appear here.</CardDescription>
          </CardHeader>

          <CardContent>
            <Link
              href="/"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
            >
              Return to ForecastMe
            </Link>
          </CardContent>
        </Card>
      </main>
    </ProtectedRoute>
  );
}
