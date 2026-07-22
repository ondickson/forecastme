'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Database,
  Files,
  LineChart,
  LoaderCircle,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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

interface DomainMetadata {
  label: string;
  icon: LucideIcon;
  className: string;
}

const PAGE_LIMIT = 100;

const filters: StatusFilter[] = ['All', 'Pending', 'Processing', 'Completed', 'Failed'];

const domainMetadata: Record<AnalysisDomain, DomainMetadata> = {
  GENERAL_RESEARCH: {
    label: 'General Research',
    icon: BookOpen,
    className: 'bg-violet-50 text-violet-700 ring-violet-200',
  },
  CUSTOM_DATASET: {
    label: 'Custom Dataset',
    icon: Database,
    className: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  },
  SPORTS: {
    label: 'Sports',
    icon: Trophy,
    className: 'bg-orange-50 text-orange-700 ring-orange-200',
  },
  FINANCIAL_MARKET: {
    label: 'Financial Market',
    icon: LineChart,
    className: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
};

const statusStyles: Record<DisplayStatus, string> = {
  Pending: 'bg-slate-50 text-slate-700 ring-slate-200',
  Processing: 'bg-amber-50 text-amber-800 ring-amber-200',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Failed: 'bg-red-50 text-red-700 ring-red-200',
};

const statusIcons = {
  Pending: Clock3,
  Processing: LoaderCircle,
  Completed: CheckCircle2,
  Failed: CircleAlert,
} satisfies Record<DisplayStatus, LucideIcon>;

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

  const activeCount = statusCounts.Pending + statusCounts.Processing;

  const filteredAnalyses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return analyses.filter((analysis) => {
      const displayStatus = getDisplayStatus(analysis.status);
      const domain = domainMetadata[analysis.domain];

      const matchesStatus = statusFilter === 'All' || displayStatus === statusFilter;

      const matchesQuery =
        !normalizedQuery ||
        analysis.prompt.toLowerCase().includes(normalizedQuery) ||
        domain.label.toLowerCase().includes(normalizedQuery) ||
        displayStatus.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [analyses, query, statusFilter]);

  function retryLoading() {
    setReloadVersion((version) => version + 1);
  }

  function clearFilters() {
    setQuery('');
    setStatusFilter('All');
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MobilePageHeader
        title="Analysis history"
        description="Saved requests and intelligence reports"
      />

      <main className="min-h-0 flex-1 overflow-y-auto bg-muted/20">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex min-w-0 items-start gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
                <Files className="size-5" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Analysis history
                </h1>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Review your saved questions, reports, processing status, and model confidence.
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            >
              <Plus className="size-4" aria-hidden="true" />
              New analysis
            </Link>
          </header>

          <section
            aria-label="Analysis overview"
            className="mt-7 overflow-hidden rounded-2xl border bg-background shadow-sm"
          >
            <div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0">
              <OverviewMetric
                label="Total"
                value={analyses.length}
                icon={BarChart3}
                iconClassName="bg-indigo-50 text-indigo-700"
                isLoading={isLoading}
              />

              <OverviewMetric
                label="Completed"
                value={statusCounts.Completed}
                icon={CheckCircle2}
                iconClassName="bg-emerald-50 text-emerald-700"
                isLoading={isLoading}
              />

              <OverviewMetric
                label="Active"
                value={activeCount}
                icon={Clock3}
                iconClassName="bg-amber-50 text-amber-700"
                isLoading={isLoading}
              />

              <OverviewMetric
                label="Failed"
                value={statusCounts.Failed}
                icon={CircleAlert}
                iconClassName="bg-red-50 text-red-700"
                isLoading={isLoading}
              />
            </div>
          </section>

          <section
            aria-labelledby="saved-analyses-heading"
            className="mt-6 overflow-hidden rounded-2xl border bg-background shadow-sm"
          >
            <div className="border-b bg-muted/10 p-4 sm:p-5">
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
                    placeholder="Search questions, domains, or statuses"
                    className="h-10 bg-background pl-9"
                    aria-label="Search saved analyses"
                    disabled={isLoading || loadError !== null}
                  />
                </div>

                <div
                  role="group"
                  aria-label="Filter analyses by status"
                  className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0"
                >
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
                          'inline-flex h-9 shrink-0 items-center rounded-lg border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                          isSelected
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
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

            <div className="flex items-center justify-between gap-4 border-b px-4 py-4 sm:px-5">
              <div>
                <h2 id="saved-analyses-heading" className="font-semibold text-foreground">
                  Saved analyses
                </h2>

                <p className="mt-0.5 text-sm text-muted-foreground">
                  Select an analysis to open its full report.
                </p>
              </div>

              {!isLoading && !loadError ? (
                <span
                  className="shrink-0 text-sm tabular-nums text-muted-foreground"
                  aria-live="polite"
                >
                  {filteredAnalyses.length} {filteredAnalyses.length === 1 ? 'result' : 'results'}
                </span>
              ) : null}
            </div>

            {isLoading ? (
              <div className="p-4 sm:p-5">
                <HistoryLoadingState />
              </div>
            ) : loadError ? (
              <div className="p-4 sm:p-5">
                <HistoryErrorState
                  title={loadError.title}
                  message={loadError.message}
                  onRetry={loadError.canRetry ? retryLoading : undefined}
                />
              </div>
            ) : analyses.length === 0 ? (
              <div className="p-4 sm:p-5">
                <EmptyHistoryState />
              </div>
            ) : filteredAnalyses.length === 0 ? (
              <div className="p-4 sm:p-5">
                <NoMatchingAnalysesState onClear={clearFilters} />
              </div>
            ) : (
              <AnalysisList analyses={filteredAnalyses} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

interface OverviewMetricProps {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClassName: string;
  isLoading: boolean;
}

function OverviewMetric({
  label,
  value,
  icon: Icon,
  iconClassName,
  isLoading,
}: OverviewMetricProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-5 sm:py-5">
      <div
        className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', iconClassName)}
      >
        <Icon className="size-4.5" aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>

        <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight text-foreground">
          {isLoading ? '—' : value}
        </p>
      </div>
    </div>
  );
}

function AnalysisList({ analyses }: { analyses: AnalysisHistoryItem[] }) {
  return (
    <div>
      <div
        className="hidden grid-cols-[minmax(0,1fr)_9.5rem_11rem_1.5rem] gap-5 border-b bg-muted/20 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid"
        aria-hidden="true"
      >
        <span>Analysis request</span>
        <span>Model confidence</span>
        <span>Created</span>
        <span />
      </div>

      <div className="divide-y">
        {analyses.map((analysis) => (
          <AnalysisRow key={analysis.id} analysis={analysis} />
        ))}
      </div>
    </div>
  );
}

function AnalysisRow({ analysis }: { analysis: AnalysisHistoryItem }) {
  const displayStatus = getDisplayStatus(analysis.status);
  const StatusIcon = statusIcons[displayStatus];
  const domain = domainMetadata[analysis.domain];
  const DomainIcon = domain.icon;

  const isActive = displayStatus === 'Pending' || displayStatus === 'Processing';

  return (
    <Link
      href={`/history/${encodeURIComponent(analysis.id)}`}
      className="group block focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600"
      aria-label={`Open analysis: ${analysis.prompt}`}
    >
      <article className="transition-colors group-hover:bg-indigo-50/30">
        <div className="p-4 md:hidden">
          <div className="flex items-start justify-between gap-3">
            <DomainBadge icon={DomainIcon} label={domain.label} className={domain.className} />

            <StatusBadge status={displayStatus} icon={StatusIcon} />
          </div>

          <h3
            className="mt-3 line-clamp-3 break-words text-base font-semibold leading-6 text-foreground"
            title={analysis.prompt}
          >
            {analysis.prompt}
          </h3>

          {isActive ? <ActiveStatusMessage status={displayStatus} /> : null}

          <dl className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Model confidence
              </dt>

              <dd className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                {analysis.confidenceScore !== null
                  ? formatPercentage(analysis.confidenceScore)
                  : 'Not available'}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Created
              </dt>

              <dd className="mt-1 text-sm font-medium text-foreground">
                {formatDateTime(analysis.createdAt)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex items-center justify-end gap-1 text-sm font-semibold text-indigo-700">
            Open report
            <ChevronRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="hidden grid-cols-[minmax(0,1fr)_9.5rem_11rem_1.5rem] items-center gap-5 px-5 py-4 md:grid">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <DomainBadge icon={DomainIcon} label={domain.label} className={domain.className} />

              <StatusBadge status={displayStatus} icon={StatusIcon} />
            </div>

            <h3
              className="mt-2 line-clamp-2 break-words text-sm font-semibold leading-6 text-foreground"
              title={analysis.prompt}
            >
              {analysis.prompt}
            </h3>

            {isActive ? <ActiveStatusMessage status={displayStatus} compact /> : null}
          </div>

          <div>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {analysis.confidenceScore !== null ? formatPercentage(analysis.confidenceScore) : '—'}
            </span>
          </div>

          <time dateTime={analysis.createdAt} className="text-sm leading-5 text-muted-foreground">
            {formatDateTime(analysis.createdAt)}
          </time>

          <ChevronRight
            className="size-5 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-indigo-700"
            aria-hidden="true"
          />
        </div>
      </article>
    </Link>
  );
}

function DomainBadge({
  icon: Icon,
  label,
  className,
}: {
  icon: LucideIcon;
  label: string;
  className: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

function StatusBadge({ status, icon: Icon }: { status: DisplayStatus; icon: LucideIcon }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        statusStyles[status],
      )}
    >
      <Icon
        className={cn(
          'size-3.5',
          status === 'Processing' && 'animate-spin motion-reduce:animate-none',
        )}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}

function ActiveStatusMessage({
  status,
  compact = false,
}: {
  status: DisplayStatus;
  compact?: boolean;
}) {
  const message =
    status === 'Pending'
      ? 'Waiting for processing to begin.'
      : 'ForecastMe is generating this report.';

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-amber-800',
        compact ? 'mt-2 text-xs' : 'mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm',
      )}
    >
      <Sparkles
        className="size-3.5 shrink-0 animate-pulse motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span>{message}</span>
    </div>
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
        className="size-7 animate-spin text-indigo-700 motion-reduce:animate-none"
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
