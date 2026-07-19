import { ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercentage, UNAVAILABLE_RESULT_VALUE } from '@/lib/analysis/result-formatters';
import type { AnalysisConfidence } from '@/types/analysis';

interface ConfidenceSectionProps {
  confidence: AnalysisConfidence;
}

function formatConfidenceLevel(level: AnalysisConfidence['level']): string {
  if (!level) {
    return UNAVAILABLE_RESULT_VALUE;
  }

  return `${level.charAt(0)}${level.slice(1).toLowerCase()}`;
}

export function ConfidenceSection({ confidence }: ConfidenceSectionProps) {
  const formattedScore = formatPercentage(confidence.score, 1);
  const formattedLevel = formatConfidenceLevel(confidence.level);
  const hasConfidence =
    formattedScore !== UNAVAILABLE_RESULT_VALUE || formattedLevel !== UNAVAILABLE_RESULT_VALUE;

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle as="h3" className="flex items-center gap-2 text-base">
          <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
          Confidence
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p
            aria-label={`Confidence score: ${formattedScore}`}
            className="text-3xl font-semibold tracking-tight text-foreground"
          >
            {formattedScore}
          </p>

          {formattedLevel !== UNAVAILABLE_RESULT_VALUE && (
            <Badge variant="outline">{formattedLevel} confidence</Badge>
          )}
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          {confidence.explanation ??
            (hasConfidence
              ? 'Confidence describes the reliability of the estimate, not its probability.'
              : 'ForecastMe could not determine a reliable confidence level for this analysis.')}
        </p>
      </CardContent>
    </Card>
  );
}
