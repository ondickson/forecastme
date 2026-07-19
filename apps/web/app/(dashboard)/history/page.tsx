'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  Files,
  LoaderCircle,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import { MobilePageHeader } from '@/components/app-shell/mobile-page-header';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api/errors';
import { formatDateTime, formatPercentage } from '@/lib/analysis/result-formatters';
import { cn } from '@/lib/utils';
import { listAnalyses } from '@/services/analysis-service';
import type { AnalysisDomain, AnalysisHistoryItem, AnalysisStatus } from '@/types/analysis';

type DisplayStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed';

type StatusFilter = 'All' | DisplayStatus;

interface HistoryLoadError {
  title: string;
  message: string;
  canRetry: boolean;
}

const PAGE_LIMIT = 100;

const filters: StatusFilter[] = ['All', 'Pending', 'Processing', 'Completed', 'Failed'];

const domainLabels: Record<AnalysisDomain, string> = {
  GENERAL_RESEARCH: 'General Research',
  CUSTOM_DATASET: 'Custom Dataset',
  SPORTS: 'Sports',
  FINANCIAL_MARKET: 'Financial Market',
};

const statusStyles: Record<DisplayStatus, string> = {
  Pending: 'bg-slate-50 text-slate-700 ring-slate-200',
  Processing: 'bg-amber-50 text-amber-700 ring-amber-200',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Failed: 'bg-red-50 text-red-700 ring-red-200',
};

const statusIcons = {
  Pending: Clock3,
  Processing: LoaderCircle,
  Completed: CheckCircle2,
  Failed: CircleAlert,
} satisfies Record<DisplayStatus, typeof CheckCircle2>;

function getDisplayStatus(status: AnalysisStatus): DisplayStatus {
  switch (status) {
    case 'PENDING':
      return 'Pending';

    case 'COMPLETED':
      return 'Completed';

    case 'FAILED':
      return 'Failed';

    case 'CLASSIFYING':
    case 'COLLECTING_DATA':
    case 'ANALYZING':
      return 'Processing';
  }
}

function getHistoryLoadError(error: unknown): HistoryLoadError {
  if (error instanceof ApiError) {
    if (error.code === 'INVALID_API_RESPONSE') {
      return {
        title: 'Invalid history response',
        message: 'ForecastMe received malformed analysis-history data. No records were displayed.',
        canRetry: true,
      };
    }

    if (error.code === 'NETWORK_ERROR' || error.status === 0) {
      return {
        title: 'ForecastMe is offline',
        message:
          'The ForecastMe API could not be reached. Check that the API is running and try again.',
        canRetry: true,
      };
    }

    if (error.status === 401) {
      return {
        title: 'Session expired',
        message:
          'Your session has expired. You will need to log in again to view your saved analyses.',
        canRetry: false,
      };
    }

    if (error.status === 403) {
      return {
        title: 'Access denied',
        message: 'You do not have permission to view these saved analyses.',
        canRetry: false,
      };
    }
  }

  return {
    title: 'Could not load analyses',
    message: 'ForecastMe could not retrieve your saved analyses. Please try again.',
    canRetry: true,
  };
}

async function fetchAllAnalyses(): Promise<AnalysisHistoryItem[]> {
  const firstPage = await listAnalyses({
    page: 1,
    limit: PAGE_LIMIT,
  });

  const items = [...firstPage.items];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const response = await listAnalyses({
      page,
      limit: PAGE_LIMIT,
    });

    items.push(...response.items);
  }

  return items;
}

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<HistoryLoadError | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let ignoreResult = false;

    async function loadHistory() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const history = await fetchAllAnalyses();

        if (!ignoreResult) {
          setAnalyses(history);
        }
      } catch (error) {
        if (!ignoreResult) {
          setAnalyses([]);
          setLoadError(getHistoryLoadError(error));
        }
      } finally {
        if (!ignoreResult) {
          setIsLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      ignoreResult = true;
    };
  }, [reloadVersion]);

  const statusCounts = useMemo(() => {
    const counts: Record<DisplayStatus, number> = {
      Pending: 0,
      Processing: 0,
      Completed: 0,
      Failed: 0,
    };

    for (const analysis of analyses) {
      counts[getDisplayStatus(analysis.status)] += 1;
    }

    return counts;
  }, [analyses]);

  const filteredAnalyses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return analyses.filter((analysis) => {
      const displayStatus = getDisplayStatus(analysis.status);
      const domainLabel = domainLabels[analysis.domain];

      const matchesStatus = statusFilter === 'All' || displayStatus === statusFilter;

      const matchesQuery =
        !normalizedQuery ||
        analysis.prompt.toLowerCase().includes(normalizedQuery) ||
        domainLabel.toLowerCase().includes(normalizedQuery) ||
        displayStatus.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [analyses, query, statusFilter]);

  function retryLoading() {
    setReloadVersion((version) => version + 1);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MobilePageHeader title="Analyses" description="Saved requests and intelligence reports" />

      <main className="min-h-0 flex-1 overflow-y-auto bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <Files className="size-5" aria-hidden="true" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Analyses
                </h1>

                <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                  Review your saved requests, results, confidence, and status.
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            >
              <Plus className="size-4" aria-hidden="true" />
              New analysis
            </Link>
          </div>

          <section
            aria-label="Analysis summary"
            className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <SummaryCard
              label="Total analyses"
              value={analyses.length}
              icon={Files}
              iconClassName="bg-indigo-50 text-indigo-700"
              isLoading={isLoading}
            />

            <SummaryCard
              label="Completed"
              value={statusCounts.Completed}
              icon={CheckCircle2}
              iconClassName="bg-emerald-50 text-emerald-700"
              isLoading={isLoading}
            />

            <SummaryCard
              label="Processing"
              value={statusCounts.Pending + statusCounts.Processing}
              icon={Clock3}
              iconClassName="bg-amber-50 text-amber-700"
              isLoading={isLoading}
            />

            <SummaryCard
              label="Failed"
              value={statusCounts.Failed}
              icon={CircleAlert}
              iconClassName="bg-red-50 text-red-700"
              isLoading={isLoading}
            />
          </section>

          <section className="mt-6 overflow-hidden rounded-2xl border bg-background shadow-sm">
            <div className="border-b p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />

                  <Input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search analyses or domains..."
                    className="pl-9"
                    aria-label="Search analyses"
                    disabled={isLoading || loadError !== null}
                  />
                </div>

                <div className="flex flex-wrap gap-2" aria-label="Filter analyses by status">
                  {filters.map((filter) => {
                    const isSelected = statusFilter === filter;

                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setStatusFilter(filter)}
                        aria-pressed={isSelected}
                        disabled={isLoading || loadError !== null}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                          isSelected
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        {filter}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-foreground">Recent analyses</h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Saved analysis requests for your account.
                  </p>
                </div>

                {!isLoading && !loadError ? (
                  <span className="text-sm text-muted-foreground">
                    {filteredAnalyses.length} {filteredAnalyses.length === 1 ? 'result' : 'results'}
                  </span>
                ) : null}
              </div>

              {isLoading ? (
                <HistoryLoadingState />
              ) : loadError ? (
                <HistoryErrorState
                  title={loadError.title}
                  message={loadError.message}
                  onRetry={loadError.canRetry ? retryLoading : undefined}
                />
              ) : analyses.length === 0 ? (
                <EmptyHistoryState />
              ) : filteredAnalyses.length === 0 ? (
                <NoMatchingAnalysesState
                  onClear={() => {
                    setQuery('');
                    setStatusFilter('All');
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {filteredAnalyses.map((analysis) => (
                    <AnalysisCard key={analysis.id} analysis={analysis} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  icon: typeof Files;
  iconClassName: string;
  isLoading: boolean;
}

function SummaryCard({ label, value, icon: Icon, iconClassName, isLoading }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border bg-background p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {isLoading ? '—' : value}
          </p>
        </div>

        <div className={cn('flex size-10 items-center justify-center rounded-xl', iconClassName)}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function AnalysisCard({ analysis }: { analysis: AnalysisHistoryItem }) {
  const displayStatus = getDisplayStatus(analysis.status);
  const StatusIcon = statusIcons[displayStatus];

  return (
    <Link
      href={`/history/${encodeURIComponent(analysis.id)}`}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      aria-label={`Open analysis: ${analysis.prompt}`}
    >
      <article className="rounded-xl border bg-background p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/20 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {domainLabels[analysis.domain]}
              </span>

              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                  statusStyles[displayStatus],
                )}
              >
                <StatusIcon
                  className={cn(
                    'size-3.5',
                    displayStatus === 'Processing' && 'animate-spin motion-reduce:animate-none',
                  )}
                  aria-hidden="true"
                />
                {displayStatus}
              </span>
            </div>

            <h3
              className="mt-3 line-clamp-3 min-w-0 break-words text-md font-semibold leading-6 text-foreground sm:line-clamp-2"
              title={analysis.prompt}
            >
              {analysis.prompt}
            </h3>
          </div>

          <div className="flex shrink-0 items-center gap-6 xl:justify-end">
            {analysis.confidenceScore !== null ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Confidence
                </p>

                <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <TrendingUp className="size-4 text-emerald-600" aria-hidden="true" />
                  {formatPercentage(analysis.confidenceScore)}
                </div>
              </div>
            ) : null}

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Created
              </p>

              <p className="mt-1 whitespace-nowrap text-sm font-medium text-foreground">
                {formatDateTime(analysis.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {displayStatus === 'Pending' || displayStatus === 'Processing' ? (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <Sparkles
              className="size-4 animate-pulse motion-reduce:animate-none"
              aria-hidden="true"
            />

            {displayStatus === 'Pending'
              ? 'This analysis is waiting to begin.'
              : 'ForecastMe is processing this analysis.'}
          </div>
        ) : null}
      </article>
    </Link>
  );
}

function HistoryLoadingState() {
  return (
    <div
      className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoaderCircle
        className="size-7 animate-spin motion-reduce:animate-none text-indigo-700"
        aria-hidden="true"
      />

      <h3 className="mt-4 font-semibold text-foreground">Loading analyses</h3>

      <p className="mt-1 text-sm text-muted-foreground">Retrieving your saved analysis history.</p>
    </div>
  );
}

function HistoryErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/40 px-6 py-12 text-center"
      role="alert"
    >
      <CircleAlert className="size-7 text-red-700" aria-hidden="true" />

      <h3 className="mt-4 font-semibold text-foreground">{title}</h3>

      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{message}</p>

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </button>
      ) : null}
    </div>
  );
}

function EmptyHistoryState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
      <Files className="size-7 text-indigo-700" aria-hidden="true" />

      <h3 className="mt-4 font-semibold text-foreground">No saved analyses yet</h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        Submit your first question to create a saved analysis report.
      </p>

      <Link
        href="/"
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      >
        <Plus className="size-4" aria-hidden="true" />
        New analysis
      </Link>
    </div>
  );
}

function NoMatchingAnalysesState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
      <Search className="size-7 text-indigo-700" aria-hidden="true" />

      <h3 className="mt-4 font-semibold text-foreground">No matching analyses</h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        Try another search term or clear the current status filter.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="mt-5 inline-flex h-10 items-center justify-center rounded-lg border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      >
        Clear filters
      </button>
    </div>
  );
}
