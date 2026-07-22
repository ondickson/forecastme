// forecastme - apps/web/app/(dashboard)/history/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  LoaderCircle,
  MoreHorizontal,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { AnalysisResultView } from '@/components/analysis-results/analysis-result-view';
import { ResultEmptyState } from '@/components/analysis-results/result-empty-state';
import { ResultErrorState } from '@/components/analysis-results/result-error-state';
import { ResultLoadingState } from '@/components/analysis-results/result-loading-state';
import { MobilePageHeader } from '@/components/app-shell/mobile-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/analysis/result-formatters';
import { cn } from '@/lib/utils';
import { deleteAnalysis, getAnalysis } from '@/services/analysis-service';
import type { AnalysisDomain, AnalysisRequestRecord, AnalysisStatus } from '@/types/analysis';

const domainLabels: Record<AnalysisDomain, string> = {
  GENERAL_RESEARCH: 'General Research',
  CUSTOM_DATASET: 'Custom Dataset',
  SPORTS: 'Sports',
  FINANCIAL_MARKET: 'Financial Market',
};

const statusLabels: Record<AnalysisStatus, string> = {
  PENDING: 'Pending',
  CLASSIFYING: 'Classifying',
  COLLECTING_DATA: 'Collecting Data',
  ANALYZING: 'Analyzing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

interface DetailLoadError {
  title: string;
  message: string;
  canRetry: boolean;
  requiresLogin: boolean;
}

function getLoadError(error: unknown): DetailLoadError {
  if (error instanceof ApiError) {
    if (error.code === 'INVALID_API_RESPONSE') {
      return {
        title: 'Invalid result response',
        message:
          'ForecastMe received malformed analysis data. No result was displayed. You can retry loading the saved result.',
        canRetry: true,
        requiresLogin: false,
      };
    }

    if (error.code === 'NETWORK_ERROR' || error.status === 0) {
      return {
        title: 'ForecastMe is offline',
        message:
          'The ForecastMe API could not be reached. Check that the API is running and try again.',
        canRetry: true,
        requiresLogin: false,
      };
    }

    if (error.status === 404) {
      return {
        title: 'Analysis not found',
        message: 'This analysis does not exist or is no longer available.',
        canRetry: false,
        requiresLogin: false,
      };
    }

    if (error.status === 403) {
      return {
        title: 'Access denied',
        message: 'You do not have permission to view this analysis.',
        canRetry: false,
        requiresLogin: false,
      };
    }

    if (error.status === 401) {
      return {
        title: 'Session expired',
        message: 'Your session has expired. Log in again to view this analysis.',
        canRetry: false,
        requiresLogin: true,
      };
    }
  }

  return {
    title: 'Could not load analysis',
    message: 'ForecastMe could not retrieve this saved analysis. Please try again.',
    canRetry: true,
    requiresLogin: false,
  };
}

function getDeleteErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR' || error.status === 0) {
      return 'The ForecastMe API could not be reached. Check that the API is running and try again.';
    }

    if (error.status === 401) {
      return 'Your session has expired. Log in again before deleting this analysis.';
    }

    if (error.status === 403) {
      return 'You do not have permission to delete this analysis.';
    }

    if (error.code === 'INVALID_API_RESPONSE') {
      return 'ForecastMe returned an invalid deletion response. Refresh the page before trying again.';
    }
  }

  return 'ForecastMe could not delete this analysis. Please try again.';
}

function isProcessingStatus(status: AnalysisStatus): boolean {
  return (
    status === 'PENDING' ||
    status === 'CLASSIFYING' ||
    status === 'COLLECTING_DATA' ||
    status === 'ANALYZING'
  );
}

function formatParameterValue(value: string | null | undefined): string {
  if (!value) {
    return 'Not provided';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;

  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: unitIndex === 0 ? 0 : 1,
  }).format(value)} ${units[unitIndex]}`;
}

export default function AnalysisDetailPage() {
  const params = useParams<{ id: string }>();
  const analysisId = params.id;

  const [analysis, setAnalysis] = useState<AnalysisRequestRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<DetailLoadError | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let ignoreResult = false;

    async function loadAnalysis() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const savedAnalysis = await getAnalysis(analysisId);

        if (!ignoreResult) {
          setAnalysis(savedAnalysis);
        }
      } catch (error) {
        if (!ignoreResult) {
          setAnalysis(null);
          setLoadError(getLoadError(error));
        }
      } finally {
        if (!ignoreResult) {
          setIsLoading(false);
        }
      }
    }

    void loadAnalysis();

    return () => {
      ignoreResult = true;
    };
  }, [analysisId, reloadVersion]);

  function retryLoading() {
    setReloadVersion((version) => version + 1);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MobilePageHeader title="Analysis report" description="Saved ForecastMe result" />

      <main className="min-h-0 flex-1 overflow-y-auto bg-muted/30">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Link
            href="/history"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Analyses
          </Link>

          {isLoading ? (
            <div className="mt-6">
              <ResultLoadingState status="loading" />
            </div>
          ) : loadError ? (
            <div className="mt-6 space-y-4">
              <ResultErrorState
                title={loadError.title}
                message={loadError.message}
                onRetry={loadError.canRetry ? retryLoading : undefined}
              />

              {loadError.requiresLogin ? (
                <Link
                  href={`/login?next=${encodeURIComponent(`/history/${analysisId}`)}`}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                >
                  Log in
                </Link>
              ) : null}
            </div>
          ) : analysis ? (
            <AnalysisDetail analysis={analysis} onRefresh={retryLoading} />
          ) : (
            <div className="mt-6">
              <ResultErrorState
                title="Analysis unavailable"
                message="ForecastMe could not retrieve this analysis."
                onRetry={retryLoading}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function AnalysisDetail({
  analysis,
  onRefresh,
}: {
  analysis: AnalysisRequestRecord;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  function handleDeleteDialogOpenChange(open: boolean) {
    if (isDeleting) {
      return;
    }

    setDeleteDialogOpen(open);

    if (!open) {
      setDeleteError(null);
    }
  }
  const processing = isProcessingStatus(analysis.status);
  const failed = analysis.status === 'FAILED';
  const completed = analysis.status === 'COMPLETED';
  const attachment = analysis.parameters?.attachment;

  const statusClassName = failed
    ? undefined
    : processing
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : completed
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : undefined;

  async function handleDeleteAnalysis() {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteAnalysis(analysis.id);
      setDeleteDialogOpen(false);
      router.replace('/history');
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        router.replace('/history');
        router.refresh();
        return;
      }

      setDeleteError(getDeleteErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mt-6 space-y-8">
      <header className="rounded-2xl border bg-background p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {domainLabels[analysis.domain]}
              </span>

              <Badge variant={failed ? 'destructive' : 'secondary'} className={statusClassName}>
                {processing ? (
                  <LoaderCircle
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : null}

                {statusLabels[analysis.status]}
              </Badge>
            </div>

            <h1 className="mt-4 [overflow-wrap:anywhere] text-xl font-semibold leading-tight text-foreground sm:text-2xl">
              {analysis.prompt}
            </h1>

            <dl className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Created</dt>
                <dd>{formatDateTime(analysis.createdAt)}</dd>
              </div>

              <div className="flex items-center gap-1.5 before:text-border before:content-['•']">
                <dt>Horizon:</dt>
                <dd className="font-medium text-foreground">
                  {formatParameterValue(analysis.parameters?.timeHorizon)}
                </dd>
              </div>

              <div className="flex items-center gap-1.5 before:text-border before:content-['•']">
                <dt>Risk:</dt>
                <dd className="font-medium text-foreground">
                  {formatParameterValue(analysis.parameters?.riskPreference)}
                </dd>
              </div>
            </dl>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Open analysis actions"
                  disabled={isDeleting}
                />
              }
            >
              <MoreHorizontal className="size-5" aria-hidden="true" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="size-4" aria-hidden="true" />
                Delete analysis
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this analysis?</DialogTitle>

              <DialogDescription>
                This permanently deletes the saved question and its result. This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>

            {deleteError ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {deleteError}
              </div>
            ) : null}

            <DialogFooter>
              <DialogClose
                render={<Button type="button" variant="outline" disabled={isDeleting} />}
              >
                Cancel
              </DialogClose>

              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting}
                onClick={() => void handleDeleteAnalysis()}
              >
                {isDeleting ? (
                  <LoaderCircle
                    className="size-4 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : (
                  <Trash2 className="size-4" aria-hidden="true" />
                )}

                {isDeleting ? 'Deleting…' : 'Delete permanently'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <details className="group rounded-2xl border bg-background shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-4 font-semibold text-foreground outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 motion-reduce:transition-none sm:px-6 [&::-webkit-details-marker]:hidden">
          Request details
          <ChevronDown
            className="size-4 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </summary>

        <dl className="grid gap-x-8 gap-y-5 border-t px-5 py-5 sm:grid-cols-2 sm:px-6">
          <RequestDetail label="Created" value={formatDateTime(analysis.createdAt)} />
          <RequestDetail
            label="Completed"
            value={analysis.completedAt ? formatDateTime(analysis.completedAt) : 'Not completed'}
          />
          <RequestDetail label="Attachment" value={attachment?.name ?? 'Not provided'} />
          <RequestDetail label="File type" value={attachment?.type || 'Not provided'} />
          <RequestDetail label="Extension" value={attachment?.extension || 'Not provided'} />
          <RequestDetail
            label="File size"
            value={attachment ? formatFileSize(attachment.size) : 'Not provided'}
          />
        </dl>
      </details>

      <section aria-labelledby="analysis-content-heading" className="min-w-0">
        <h2 id="analysis-content-heading" className="sr-only">
          {processing ? 'Analysis progress' : failed ? 'Analysis outcome' : 'Analysis result'}
        </h2>

        {processing ? (
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm leading-6 text-muted-foreground">
                ForecastMe is still working on this request. Refresh to check for the latest status.
              </p>

              <Button type="button" variant="outline" onClick={onRefresh}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Refresh status
              </Button>
            </div>

            <ResultLoadingState status={analysis.status} />
          </div>
        ) : failed ? (
          <ResultErrorState
            title="Analysis could not be completed"
            message="ForecastMe could not complete this request, so no result was saved. You can keep this record for reference or delete it from the analysis actions menu."
          />
        ) : completed && analysis.result ? (
          <AnalysisResultView result={analysis.result.content} domain={analysis.domain} />
        ) : completed ? (
          <ResultEmptyState
            title="Result unavailable"
            description="The analysis completed, but no saved result was returned. ForecastMe will not invent missing result data."
          />
        ) : (
          <ResultEmptyState
            title="No saved result"
            description="This analysis does not currently have a saved result."
          />
        )}
      </section>
    </div>
  );
}

function RequestDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>

      <dd
        className={cn(
          'mt-1 break-words text-sm font-medium text-foreground',
          (value === 'Not provided' || value === 'Not completed') && 'text-muted-foreground',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
