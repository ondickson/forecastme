import { Percent } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercentage, UNAVAILABLE_RESULT_VALUE } from '@/lib/analysis/result-formatters';

interface ProbabilitySectionProps {
  probability: number | null;
}

export function ProbabilitySection({ probability }: ProbabilitySectionProps) {
  const formattedProbability = formatPercentage(probability, 1);
  const isAvailable = formattedProbability !== UNAVAILABLE_RESULT_VALUE;
  const probabilityPercent = isAvailable && probability !== null ? probability * 100 : null;

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle as="h3" className="flex items-center gap-2 text-base">
          <Percent aria-hidden="true" className="size-4 text-primary" />
          Probability
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <p
          aria-label={`Estimated outcome probability: ${formattedProbability}`}
          className="text-3xl font-semibold tracking-tight text-foreground"
        >
          {formattedProbability}
        </p>

        <p className="text-xs leading-5 text-muted-foreground">
          {isAvailable
            ? 'Estimated likelihood of the predicted outcome—not a guarantee.'
            : 'A reliable probability could not be calculated for this analysis.'}
        </p>
        {probabilityPercent !== null ? (
          <div
            role="progressbar"
            aria-label="Estimated outcome probability"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={probabilityPercent}
            aria-valuetext={formattedProbability}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div
              aria-hidden="true"
              className="h-full rounded-full bg-primary"
              style={{ width: `${probabilityPercent}%` }}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
