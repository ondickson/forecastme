'use client';

import { CircleAlert, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ResultErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ResultErrorState({
  title = 'Analysis failed',
  message = 'ForecastMe could not complete this analysis. Please try again.',
  onRetry,
}: ResultErrorStateProps) {
  return (
    <Card role="alert" className="border-destructive/40 bg-destructive/5">
      <CardHeader className="gap-2">
        <CardTitle as="h3" className="flex items-center gap-2 text-base">
          <CircleAlert aria-hidden="true" className="size-4 text-destructive" />
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{message}</p>

        {onRetry && (
          <Button type="button" variant="outline" onClick={onRetry}>
            <RotateCcw aria-hidden="true" className="size-4" />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
