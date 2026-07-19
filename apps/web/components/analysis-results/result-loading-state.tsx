import { LoaderCircle } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { AnalysisStatus } from '@/types/analysis';

type ResultLoadingStatus = AnalysisStatus | 'loading' | 'submitting';

interface ResultLoadingStateProps {
  status?: ResultLoadingStatus;
}

interface LoadingContent {
  title: string;
  description: string;
}

const loadingContent: Record<ResultLoadingStatus, LoadingContent> = {
  loading: {
    title: 'Loading analysis',
    description: 'ForecastMe is retrieving the saved analysis and its result.',
  },
  submitting: {
    title: 'Submitting your analysis request',
    description: 'ForecastMe is securely sending your question for processing.',
  },
  PENDING: {
    title: 'Your analysis is waiting to begin',
    description: 'The request has been saved and is waiting for processing to start.',
  },
  CLASSIFYING: {
    title: 'Determining the analysis domain',
    description: 'ForecastMe is identifying how your question should be analyzed.',
  },
  COLLECTING_DATA: {
    title: 'Collecting available data',
    description: 'ForecastMe is gathering the information available for this analysis.',
  },
  ANALYZING: {
    title: 'Evaluating the available information',
    description: 'ForecastMe is processing the available information and preparing the result.',
  },
  COMPLETED: {
    title: 'Preparing completed result',
    description: 'ForecastMe is preparing the completed analysis for display.',
  },
  FAILED: {
    title: 'Loading failure details',
    description: 'ForecastMe is retrieving information about the failed analysis.',
  },
};

export function ResultLoadingState({ status = 'loading' }: ResultLoadingStateProps) {
  const content = loadingContent[status];

  return (
    <section
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={content.title}
      className="space-y-4"
    >
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none text-primary"
            />

            <p className="text-sm font-medium text-foreground">{content.title}</p>
          </div>

          <p className="text-sm leading-6 text-muted-foreground">{content.description}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />

          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>

          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </section>
  );
}
