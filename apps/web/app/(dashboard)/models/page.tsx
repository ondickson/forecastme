'use client';

import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Brain,
  CheckCircle2,
  Clock3,
  FlaskConical,
  Gauge,
  GitBranch,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';

import { MobilePageHeader } from '@/components/app-shell/mobile-page-header';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ModelStatus = 'Active' | 'Development' | 'Planned';
type StatusFilter = 'All' | ModelStatus;

interface ModelMetric {
  label: string;
  value: string;
  score: number | null;
}

interface MockModel {
  id: string;
  name: string;
  description: string;
  domain: string;
  version: string;
  algorithm: string;
  status: ModelStatus;
  lastEvaluated: string;
  metrics: ModelMetric[];
}

const models: MockModel[] = [
  {
    id: 'model-001',
    name: 'Domain Intent Classifier',
    description:
      'Identifies the analysis domain and routes each request to the appropriate ForecastMe workflow.',
    domain: 'Core Intelligence',
    version: 'v0.1.0',
    algorithm: 'Classification pipeline',
    status: 'Active',
    lastEvaluated: 'Jul 17, 2026',
    metrics: [
      {
        label: 'Accuracy',
        value: '91.8%',
        score: 91.8,
      },
      {
        label: 'F1 score',
        value: '0.90',
        score: 90,
      },
      {
        label: 'Coverage',
        value: '4 domains',
        score: null,
      },
    ],
  },
  {
    id: 'model-002',
    name: 'Sports Probability Engine',
    description:
      'Estimates event outcomes using historical performance, recent form, contextual variables, and calibration.',
    domain: 'Sports',
    version: 'v0.2.0-dev',
    algorithm: 'Gradient boosting',
    status: 'Development',
    lastEvaluated: 'Jul 15, 2026',
    metrics: [
      {
        label: 'Brier score',
        value: '0.184',
        score: 81.6,
      },
      {
        label: 'Calibration',
        value: '82.4%',
        score: 82.4,
      },
      {
        label: 'Backtests',
        value: '1,240',
        score: null,
      },
    ],
  },
  {
    id: 'model-003',
    name: 'Market Trend Classifier',
    description:
      'Evaluates directional market movement using price momentum, volatility, and macroeconomic indicators.',
    domain: 'Financial Markets',
    version: 'v0.1.0-dev',
    algorithm: 'Ensemble classifier',
    status: 'Development',
    lastEvaluated: 'Jul 14, 2026',
    metrics: [
      {
        label: 'Directional accuracy',
        value: '64.7%',
        score: 64.7,
      },
      {
        label: 'F1 score',
        value: '0.63',
        score: 63,
      },
      {
        label: 'Backtests',
        value: '860',
        score: null,
      },
    ],
  },
  {
    id: 'model-004',
    name: 'Dataset Risk Scorer',
    description:
      'Will produce deterministic probability and risk estimates from user-uploaded structured datasets.',
    domain: 'Custom Datasets',
    version: 'Not assigned',
    algorithm: 'Configurable pipeline',
    status: 'Planned',
    lastEvaluated: 'Not evaluated',
    metrics: [
      {
        label: 'Accuracy',
        value: 'Pending',
        score: null,
      },
      {
        label: 'Calibration',
        value: 'Pending',
        score: null,
      },
      {
        label: 'Backtests',
        value: 'Pending',
        score: null,
      },
    ],
  },
  {
    id: 'model-005',
    name: 'Evidence Confidence Model',
    description:
      'Will score evidence quality, source agreement, uncertainty, and confidence for research analyses.',
    domain: 'General Research',
    version: 'Not assigned',
    algorithm: 'Evidence scoring',
    status: 'Planned',
    lastEvaluated: 'Not evaluated',
    metrics: [
      {
        label: 'Precision',
        value: 'Pending',
        score: null,
      },
      {
        label: 'Source coverage',
        value: 'Pending',
        score: null,
      },
      {
        label: 'Evaluations',
        value: 'Pending',
        score: null,
      },
    ],
  },
];

const filters: StatusFilter[] = ['All', 'Active', 'Development', 'Planned'];

const statusStyles: Record<ModelStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Development: 'bg-amber-50 text-amber-700 ring-amber-200',
  Planned: 'bg-slate-100 text-slate-700 ring-slate-200',
};

const statusIcons: Record<ModelStatus, LucideIcon> = {
  Active: CheckCircle2,
  Development: FlaskConical,
  Planned: Clock3,
};

export default function ModelsPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const filteredModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return models.filter((model) => {
      const matchesStatus = statusFilter === 'All' || model.status === statusFilter;

      const matchesQuery =
        !normalizedQuery ||
        model.name.toLowerCase().includes(normalizedQuery) ||
        model.description.toLowerCase().includes(normalizedQuery) ||
        model.domain.toLowerCase().includes(normalizedQuery) ||
        model.algorithm.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  const activeCount = models.filter((model) => model.status === 'Active').length;

  const developmentCount = models.filter((model) => model.status === 'Development').length;

  const plannedCount = models.filter((model) => model.status === 'Planned').length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MobilePageHeader title="Models" description="Prediction engines and performance" />

      <main className="min-h-0 flex-1 overflow-y-auto bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <Brain className="size-5" aria-hidden="true" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Models
                </h1>

                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                  Preview data
                </span>
              </div>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Inspect model versions, lifecycle status, evaluation metrics, and supported
                analytical domains.
              </p>
            </div>
          </div>

          <section
            aria-label="Model summary"
            className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <SummaryCard
              label="Registered models"
              value={String(models.length)}
              icon={Brain}
              iconClassName="bg-indigo-50 text-indigo-700"
            />

            <SummaryCard
              label="Active"
              value={String(activeCount)}
              icon={CheckCircle2}
              iconClassName="bg-emerald-50 text-emerald-700"
            />

            <SummaryCard
              label="In development"
              value={String(developmentCount)}
              icon={FlaskConical}
              iconClassName="bg-amber-50 text-amber-700"
            />

            <SummaryCard
              label="Planned"
              value={String(plannedCount)}
              icon={Clock3}
              iconClassName="bg-slate-100 text-slate-700"
            />
          </section>

          <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>

              <div>
                <h2 className="font-semibold text-indigo-950">Transparent model registry</h2>

                <p className="mt-1 max-w-3xl text-sm leading-6 text-indigo-900/70">
                  ForecastMe will record the exact model version, evaluation metrics, inputs, and
                  confidence information used for every completed analysis.
                </p>
              </div>
            </div>
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
                    placeholder="Search models or domains..."
                    className="pl-9"
                    aria-label="Search models"
                  />
                </div>

                <div className="flex flex-wrap gap-2" aria-label="Filter models by status">
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
                  <h2 className="font-semibold text-foreground">Model registry</h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Preview of active, developing, and planned prediction engines.
                  </p>
                </div>

                <span className="text-sm text-muted-foreground">
                  {filteredModels.length} {filteredModels.length === 1 ? 'model' : 'models'}
                </span>
              </div>

              {filteredModels.length > 0 ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {filteredModels.map((model) => (
                    <ModelCard key={model.id} model={model} />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Search className="size-5" aria-hidden="true" />
                  </div>

                  <h3 className="mt-4 font-semibold text-foreground">No models found</h3>

                  <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                    Try another search term or choose a different lifecycle status.
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
  value: string;
  icon: LucideIcon;
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

interface ModelCardProps {
  model: MockModel;
}

function ModelCard({ model }: ModelCardProps) {
  const StatusIcon = statusIcons[model.status];

  return (
    <article className="flex h-full flex-col rounded-xl border bg-background p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <Brain className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold leading-6 text-foreground">{model.name}</h3>

            <p className="mt-0.5 text-sm text-muted-foreground">{model.domain}</p>
          </div>
        </div>

        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
            statusStyles[model.status],
          )}
        >
          <StatusIcon className="size-3.5" aria-hidden="true" />
          {model.status}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">{model.description}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/40 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <GitBranch className="size-3.5" aria-hidden="true" />
            Version
          </div>

          <p className="mt-1 text-sm font-semibold text-foreground">{model.version}</p>
        </div>

        <div className="rounded-lg bg-muted/40 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Method
          </div>

          <p className="mt-1 truncate text-sm font-semibold text-foreground">{model.algorithm}</p>
        </div>
      </div>

      <div className="mt-5 border-t pt-4">
        <div className="mb-3 flex items-center gap-2">
          <Gauge className="size-4 text-muted-foreground" aria-hidden="true" />

          <p className="text-sm font-semibold text-foreground">Evaluation metrics</p>
        </div>

        <div className="space-y-3">
          {model.metrics.map((metric) => (
            <div key={metric.label}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{metric.label}</span>

                <span className="font-semibold text-foreground">{metric.value}</span>
              </div>

              {metric.score !== null ? (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${metric.score}%` }}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Activity className="size-3.5" aria-hidden="true" />
          Last evaluated
        </div>

        <span className="text-xs font-medium text-foreground">{model.lastEvaluated}</span>
      </div>

      {model.status === 'Active' ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
          <Target className="size-4 shrink-0" aria-hidden="true" />
          Available for analysis routing
        </div>
      ) : null}
    </article>
  );
}
