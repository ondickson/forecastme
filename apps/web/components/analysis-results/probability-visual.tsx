import { Percent } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface ProbabilityVisualOutcome {
  label: string;
  probability: number | null;
}

interface ProbabilityVisualProps {
  outcomes: readonly ProbabilityVisualOutcome[];
  className?: string;
  variant?: 'full' | 'compact';
}

interface AvailableProbabilityOutcome {
  label: string;
  probabilityPercent: number;
  formattedProbability: string;
}

function getAvailableOutcomes(
  outcomes: readonly ProbabilityVisualOutcome[],
): AvailableProbabilityOutcome[] {
  return outcomes.flatMap((outcome, index) => {
    if (
      outcome.probability === null ||
      !Number.isFinite(outcome.probability) ||
      outcome.probability < 0 ||
      outcome.probability > 1
    ) {
      return [];
    }

    const probabilityPercent = outcome.probability * 100;

    return [
      {
        label: outcome.label.trim() || `Outcome ${index + 1}`,
        probabilityPercent,
        formattedProbability: new Intl.NumberFormat(undefined, {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(outcome.probability),
      },
    ];
  });
}

export function ProbabilityVisual({
  outcomes,
  className,
  variant = 'full',
}: ProbabilityVisualProps) {
  const availableOutcomes = getAvailableOutcomes(outcomes);
  const hasMultipleOutcomes = availableOutcomes.length > 1;
  const isCompact = variant === 'compact';

  return (
    <section
      aria-label={hasMultipleOutcomes ? 'Estimated outcome probabilities' : 'Estimated probability'}
      className={cn(
        'min-w-0 rounded-lg border bg-background/80',
        isCompact ? 'p-3' : 'p-4',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Percent aria-hidden="true" className="size-4 shrink-0 text-primary" />
        <span className={isCompact ? 'truncate' : undefined}>
          {hasMultipleOutcomes ? 'Outcome probabilities' : 'Estimated probability'}
        </span>
      </div>

      {availableOutcomes.length > 0 ? (
        <ul className={isCompact ? 'mt-2 space-y-3' : 'mt-3 space-y-4'}>
          {availableOutcomes.map((outcome, index) => (
            <li key={`${outcome.label}-${index}`}>
              <div className="flex min-w-0 items-baseline justify-between gap-2 text-sm">
                <span className={cn('min-w-0 font-medium text-foreground', isCompact && 'sr-only')}>
                  {outcome.label}
                </span>
                <span
                  className={cn(
                    'shrink-0 font-semibold tabular-nums text-foreground',
                    isCompact && 'text-2xl',
                  )}
                >
                  {outcome.formattedProbability}
                </span>
              </div>

              <div
                role="progressbar"
                aria-label={`${outcome.label}: ${outcome.formattedProbability} estimated probability`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={outcome.probabilityPercent}
                aria-valuetext={outcome.formattedProbability}
                className={cn(
                  'overflow-hidden rounded-full border bg-muted',
                  isCompact ? 'mt-2 h-2' : 'mt-2 h-3',
                )}
              >
                <div
                  aria-hidden="true"
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${outcome.probabilityPercent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p
          className={cn('font-medium text-foreground', isCompact ? 'mt-2 text-sm' : 'mt-3 text-sm')}
        >
          Probability not available
        </p>
      )}

      {!isCompact ? (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {availableOutcomes.length > 0
            ? 'Estimated likelihood of the outcome—not the confidence score or a guarantee.'
            : 'No probability visual is shown because a reliable estimate is unavailable.'}
        </p>
      ) : null}
    </section>
  );
}
