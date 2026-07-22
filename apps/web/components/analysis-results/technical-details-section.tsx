import type { LucideIcon } from 'lucide-react';
import {
  ChevronDown,
  CircleCheck,
  CircleHelp,
  Clock3,
  Cpu,
  ExternalLink,
  Library,
  TriangleAlert,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  formatDateTime,
  formatFreshnessReference,
  formatFreshnessStatus,
  UNAVAILABLE_RESULT_VALUE,
} from '@/lib/analysis/result-formatters';
import { cn } from '@/lib/utils';
import type {
  AnalysisSource,
  DataFreshness,
  FreshnessStatus,
  ModelInformation,
} from '@/types/analysis';

interface TechnicalDetailsSectionProps {
  sources: AnalysisSource[];
  model: ModelInformation;
  dataFreshness: DataFreshness;
}

interface FreshnessPresentation {
  icon: LucideIcon;
  badgeClassName: string;
  noticeClassName: string;
  iconClassName: string;
  message: string;
}

const freshnessPresentations: Record<FreshnessStatus, FreshnessPresentation> = {
  CURRENT: {
    icon: CircleCheck,
    badgeClassName: 'border-emerald-600/40 text-emerald-700 dark:text-emerald-400',
    noticeClassName:
      'border-emerald-600/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200',
    iconClassName: 'text-emerald-700 dark:text-emerald-400',
    message:
      'The underlying data was classified as current when this result was generated. Freshness may change over time.',
  },
  AGING: {
    icon: Clock3,
    badgeClassName: 'border-amber-600/40 text-amber-700 dark:text-amber-400',
    noticeClassName:
      'border-amber-600/30 bg-amber-50 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200',
    iconClassName: 'text-amber-700 dark:text-amber-400',
    message:
      'The underlying data is aging. Confirm that newer information is not available before relying on this result.',
  },
  STALE: {
    icon: TriangleAlert,
    badgeClassName: 'border-destructive/40 text-destructive',
    noticeClassName: 'border-destructive/40 bg-destructive/10 text-destructive',
    iconClassName: 'text-destructive',
    message:
      'Stale-data warning: the underlying data may no longer reflect current conditions. Verify newer information before using this result.',
  },
  UNKNOWN: {
    icon: CircleHelp,
    badgeClassName: 'text-muted-foreground',
    noticeClassName: 'border-border bg-muted/40 text-muted-foreground',
    iconClassName: 'text-muted-foreground',
    message:
      'ForecastMe could not establish how current the underlying data is. Do not assume this result uses current information.',
  },
};

function getSafeExternalUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

function getModelClassification(model: ModelInformation): string | null {
  const description = `${model.name} ${model.method ?? ''}`.toLowerCase();

  if (
    description.includes('placeholder') ||
    description.includes('contract-validator') ||
    description.includes('contract validator')
  ) {
    return 'Development validation engine';
  }

  if (description.includes('baseline')) {
    return 'Baseline model';
  }

  return null;
}

export function TechnicalDetailsSection({
  sources,
  model,
  dataFreshness,
}: TechnicalDetailsSectionProps) {
  const statusLabel = formatFreshnessStatus(dataFreshness.status);
  const freshnessPresentation = freshnessPresentations[dataFreshness.status];
  const FreshnessIcon = freshnessPresentation.icon;
  const modelClassification = getModelClassification(model);
  const isDevelopmentEngine = modelClassification === 'Development validation engine';

  return (
    <section
      id="analysis-sources"
      aria-labelledby="technical-details-heading"
      className="scroll-mt-6 space-y-3"
    >
      {dataFreshness.status === 'STALE' ? (
        <div
          role="alert"
          className={cn(
            'flex items-start gap-3 rounded-xl border p-4',
            freshnessPresentation.noticeClassName,
          )}
        >
          <FreshnessIcon
            aria-hidden="true"
            className={cn('mt-0.5 size-5 shrink-0', freshnessPresentation.iconClassName)}
          />
          <div className="space-y-1">
            <p className="text-sm font-semibold">Stale source data</p>
            <p className="text-sm leading-6">{freshnessPresentation.message}</p>
          </div>
        </div>
      ) : null}

      {isDevelopmentEngine ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-600/30 bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">Development validation result</p>
            <p className="text-sm leading-6">
              This result was generated by ForecastMe&apos;s deterministic validation engine to test
              the analysis workflow. It is not a trained forecast and should not be used for
              real-world decisions.
            </p>
          </div>
        </div>
      ) : null}

      <Card className={cn(dataFreshness.status === 'STALE' && 'border-destructive/40')}>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-5 py-4 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Library aria-hidden="true" className="size-4" />
            </span>

            <span className="min-w-0 flex-1">
              <span id="technical-details-heading" className="block text-base font-semibold">
                Sources and methodology
              </span>
              <span className="mt-0.5 block [overflow-wrap:anywhere] text-sm text-muted-foreground">
                {sources.length === 0
                  ? 'No external sources'
                  : `${sources.length} ${sources.length === 1 ? 'source' : 'sources'}`}{' '}
                · {model.name} {model.version} · {statusLabel}
              </span>
            </span>

            <Badge
              variant="outline"
              className={cn('hidden sm:inline-flex', freshnessPresentation.badgeClassName)}
            >
              {statusLabel}
            </Badge>
            <ChevronDown
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>

          <CardContent className="space-y-6 border-t pt-5">
            <section aria-labelledby="sources-heading" className="space-y-3">
              <div className="flex items-center gap-2">
                <Library aria-hidden="true" className="size-4 text-primary" />
                <h3 id="sources-heading" className="text-sm font-semibold">
                  Sources
                </h3>
              </div>

              {sources.length === 0 ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  No external sources were used for this analysis.
                </p>
              ) : (
                <ul className="grid gap-3 md:grid-cols-2">
                  {sources.map((source) => {
                    const safeUrl = getSafeExternalUrl(source.url);
                    const retrievedAt = formatDateTime(source.retrievedAt);
                    const hasRetrievalTime = retrievedAt !== UNAVAILABLE_RESULT_VALUE;

                    return (
                      <li
                        key={source.id}
                        className="min-w-0 space-y-1.5 rounded-lg border bg-muted/20 p-3"
                      >
                        {safeUrl ? (
                          <a
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-w-0 max-w-full items-start gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                          >
                            <span className="min-w-0 [overflow-wrap:anywhere]">{source.title}</span>
                            <ExternalLink aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                            <span className="sr-only">Opens in a new tab</span>
                          </a>
                        ) : (
                          <p className="[overflow-wrap:anywhere] text-sm font-medium text-foreground">
                            {source.title}
                          </p>
                        )}

                        {source.publisher ? (
                          <p className="[overflow-wrap:anywhere] text-xs text-muted-foreground">
                            Publisher: {source.publisher}
                          </p>
                        ) : null}

                        {hasRetrievalTime ? (
                          <p className="text-xs text-muted-foreground">Retrieved {retrievedAt}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <div className="grid gap-6 border-t pt-5 md:grid-cols-2">
              <section aria-labelledby="methodology-heading" className="space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu aria-hidden="true" className="size-4 text-primary" />
                  <h3 id="methodology-heading" className="text-sm font-semibold">
                    Methodology
                  </h3>
                </div>

                {modelClassification ? (
                  <Badge variant="secondary">{modelClassification}</Badge>
                ) : null}

                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="space-y-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Model
                    </dt>
                    <dd className="break-words text-foreground">{model.name}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Version
                    </dt>
                    <dd className="break-words font-mono text-foreground">{model.version}</dd>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Method or engine
                    </dt>
                    <dd className="break-words text-foreground">
                      {model.method?.trim() || 'Not available'}
                    </dd>
                  </div>
                </dl>
              </section>

              <section aria-labelledby="freshness-heading" className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock3 aria-hidden="true" className="size-4 text-primary" />
                  <h3 id="freshness-heading" className="text-sm font-semibold">
                    Data freshness
                  </h3>
                </div>

                <div
                  className={cn(
                    'flex items-start gap-2 rounded-lg border p-3',
                    freshnessPresentation.noticeClassName,
                  )}
                >
                  <FreshnessIcon
                    aria-hidden="true"
                    className={cn('mt-0.5 size-4 shrink-0', freshnessPresentation.iconClassName)}
                  />
                  <p className="text-xs leading-5">{freshnessPresentation.message}</p>
                </div>

                <p className="text-sm text-muted-foreground">
                  {formatFreshnessReference(dataFreshness)}
                </p>

                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="space-y-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Result generated
                    </dt>
                    <dd className="text-foreground">{formatDateTime(dataFreshness.generatedAt)}</dd>
                  </div>

                  {dataFreshness.dataAsOf ? (
                    <div className="space-y-1">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Underlying data date
                      </dt>
                      <dd className="text-foreground">{formatDateTime(dataFreshness.dataAsOf)}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>
            </div>
          </CardContent>
        </details>
      </Card>
    </section>
  );
}
