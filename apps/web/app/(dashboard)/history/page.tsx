'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  Files,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import { MobilePageHeader } from '@/components/app-shell/mobile-page-header';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type AnalysisStatus = 'Completed' | 'Running' | 'Failed';
type StatusFilter = 'All' | AnalysisStatus;

interface MockAnalysis {
  id: string;
  title: string;
  description: string;
  domain: string;
  status: AnalysisStatus;
  confidence: number | null;
  createdAt: string;
}

const analyses: MockAnalysis[] = [
  {
    id: 'analysis-001',
    title: 'Will Arsenal finish in the Premier League top four?',
    description:
      'Sports forecast using recent form, remaining fixtures, injuries, and historical performance.',
    domain: 'Sports',
    status: 'Completed',
    confidence: 78,
    createdAt: 'Today, 9:42 AM',
  },
  {
    id: 'analysis-002',
    title: 'What is the short-term outlook for the S&P 500?',
    description:
      'Financial-market analysis based on momentum, volatility, macroeconomic indicators, and risk.',
    domain: 'Financial Markets',
    status: 'Running',
    confidence: null,
    createdAt: 'Today, 8:15 AM',
  },
  {
    id: 'analysis-003',
    title: 'Evaluate customer churn risk from the uploaded dataset',
    description:
      'Dataset analysis examining behavioral patterns and indicators associated with customer churn.',
    domain: 'Custom Dataset',
    status: 'Completed',
    confidence: 84,
    createdAt: 'Yesterday, 4:26 PM',
  },
  {
    id: 'analysis-004',
    title: 'Assess the risks of entering a new regional market',
    description:
      'Evidence-based research covering demand, competitors, regulation, and operational exposure.',
    domain: 'General Research',
    status: 'Failed',
    confidence: null,
    createdAt: 'Jul 16, 2026',
  },
];

const filters: StatusFilter[] = ['All', 'Completed', 'Running', 'Failed'];

const statusStyles: Record<AnalysisStatus, string> = {
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Running: 'bg-amber-50 text-amber-700 ring-amber-200',
  Failed: 'bg-red-50 text-red-700 ring-red-200',
};

const statusIcons = {
  Completed: CheckCircle2,
  Running: Clock3,
  Failed: CircleAlert,
} satisfies Record<AnalysisStatus, typeof CheckCircle2>;

export default function AnalysesPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const filteredAnalyses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return analyses.filter((analysis) => {
      const matchesStatus = statusFilter === 'All' || analysis.status === statusFilter;

      const matchesQuery =
        !normalizedQuery ||
        analysis.title.toLowerCase().includes(normalizedQuery) ||
        analysis.description.toLowerCase().includes(normalizedQuery) ||
        analysis.domain.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  const completedCount = analyses.filter((analysis) => analysis.status === 'Completed').length;

  const runningCount = analyses.filter((analysis) => analysis.status === 'Running').length;

  const failedCount = analyses.filter((analysis) => analysis.status === 'Failed').length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MobilePageHeader title="Analyses" description="Saved requests and intelligence reports" />

      <main className="min-h-0 flex-1 overflow-y-auto bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                  <Files className="size-5" aria-hidden="true" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Analyses
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                    Review analysis requests, results, confidence, and status.
                  </p>
                </div>
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
            />
            <SummaryCard
              label="Completed"
              value={completedCount}
              icon={CheckCircle2}
              iconClassName="bg-emerald-50 text-emerald-700"
            />
            <SummaryCard
              label="Running"
              value={runningCount}
              icon={Clock3}
              iconClassName="bg-amber-50 text-amber-700"
            />
            <SummaryCard
              label="Failed"
              value={failedCount}
              icon={CircleAlert}
              iconClassName="bg-red-50 text-red-700"
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
                        className={cn(
                          'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
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
                    Static preview data for the upcoming analyses workflow.
                  </p>
                </div>

                <span className="text-sm text-muted-foreground">
                  {filteredAnalyses.length} {filteredAnalyses.length === 1 ? 'result' : 'results'}
                </span>
              </div>

              {filteredAnalyses.length > 0 ? (
                <div className="space-y-3">
                  {filteredAnalyses.map((analysis) => (
                    <AnalysisCard key={analysis.id} analysis={analysis} />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Search className="size-5" aria-hidden="true" />
                  </div>

                  <h3 className="mt-4 font-semibold text-foreground">No analyses found</h3>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                    Try another search term or choose a different status filter.
                  </p>
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
}

function SummaryCard({ label, value, icon: Icon, iconClassName }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border bg-background p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
        </div>

        <div className={cn('flex size-10 items-center justify-center rounded-xl', iconClassName)}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

interface AnalysisCardProps {
  analysis: MockAnalysis;
}

function AnalysisCard({ analysis }: AnalysisCardProps) {
  const StatusIcon = statusIcons[analysis.status];

  return (
    <article className="rounded-xl border bg-background p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/20 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              {analysis.domain}
            </span>

            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                statusStyles[analysis.status],
              )}
            >
              <StatusIcon className="size-3.5" aria-hidden="true" />
              {analysis.status}
            </span>
          </div>

          <h3 className="mt-3 text-base font-semibold leading-6 text-foreground">
            {analysis.title}
          </h3>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            {analysis.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-6 xl:justify-end">
          {analysis.confidence !== null ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Confidence
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <TrendingUp className="size-4 text-emerald-600" aria-hidden="true" />
                {analysis.confidence}%
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Created
            </p>
            <p className="mt-1 whitespace-nowrap text-sm font-medium text-foreground">
              {analysis.createdAt}
            </p>
          </div>
        </div>
      </div>

      {analysis.status === 'Running' ? (
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <Sparkles className="size-4 animate-pulse" aria-hidden="true" />
          ForecastMe is gathering evidence and evaluating the request.
        </div>
      ) : null}
    </article>
  );
}
