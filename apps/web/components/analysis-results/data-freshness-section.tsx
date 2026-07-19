import type { LucideIcon } from 'lucide-react';
import { CircleCheck, CircleHelp, Clock3, TriangleAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  formatDateTime,
  formatFreshnessReference,
  formatFreshnessStatus,
} from '@/lib/analysis/result-formatters';
import { cn } from '@/lib/utils';
import type { DataFreshness, FreshnessStatus } from '@/types/analysis';

interface DataFreshnessSectionProps {
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

export function DataFreshnessSection({ dataFreshness }: DataFreshnessSectionProps) {
  const statusLabel = formatFreshnessStatus(dataFreshness.status);
  const presentation = freshnessPresentations[dataFreshness.status];
  const StatusIcon = presentation.icon;

  return (
    <Card className={cn(dataFreshness.status === 'STALE' && 'border-destructive/50')}>
      <CardHeader className="gap-2">
        <CardTitle as="h3" className="flex items-center gap-2 text-base">
          <Clock3 aria-hidden="true" className="size-4 text-primary" />
          Data freshness
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Badge variant="outline" className={presentation.badgeClassName}>
          {statusLabel}
        </Badge>

        <div
          role={dataFreshness.status === 'STALE' ? 'alert' : undefined}
          className={cn(
            'flex items-start gap-2 rounded-lg border p-3',
            presentation.noticeClassName,
          )}
        >
          <StatusIcon
            aria-hidden="true"
            className={cn('mt-0.5 size-4 shrink-0', presentation.iconClassName)}
          />

          <p className="text-xs leading-5">{presentation.message}</p>
        </div>

        <p className="text-sm text-muted-foreground">{formatFreshnessReference(dataFreshness)}</p>

        <dl className="grid gap-3 text-sm">
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
      </CardContent>
    </Card>
  );
}
