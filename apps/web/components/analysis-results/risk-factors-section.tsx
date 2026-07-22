import { ShieldAlert, TriangleAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RiskFactor, StrengthLevel } from '@/types/analysis';

interface RiskFactorsSectionProps {
  riskFactors: RiskFactor[];
}

const INITIAL_RISK_LIMIT = 3;

const severityRank: Record<StrengthLevel, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function formatSeverity(severity: StrengthLevel | null): string {
  if (!severity) {
    return 'Severity unavailable';
  }

  return `${severity.charAt(0)}${severity.slice(1).toLowerCase()} severity`;
}

function sortBySeverity(riskFactors: readonly RiskFactor[]): RiskFactor[] {
  return [...riskFactors].sort(
    (left, right) =>
      (right.severity ? severityRank[right.severity] : 0) -
      (left.severity ? severityRank[left.severity] : 0),
  );
}

function getConciseText(
  value: string,
  characterLimit = 220,
): {
  concise: string;
  isTruncated: boolean;
} {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (normalized.length <= characterLimit) {
    return { concise: normalized, isTruncated: false };
  }

  const shortened = normalized.slice(0, characterLimit + 1);
  const lastSpace = shortened.lastIndexOf(' ');
  const end = lastSpace > 0 ? lastSpace : characterLimit;

  return {
    concise: `${shortened.slice(0, end).trimEnd()}…`,
    isTruncated: true,
  };
}

function RiskFactorItem({ riskFactor }: { riskFactor: RiskFactor }) {
  const isHighRisk = riskFactor.severity === 'HIGH';
  const description = getConciseText(riskFactor.description);

  return (
    <li
      className={cn(
        'space-y-2 rounded-lg border bg-muted/20 p-3',
        isHighRisk && 'border-destructive/50 bg-destructive/5',
      )}
    >
      <div className="flex items-start gap-2">
        <TriangleAlert
          aria-hidden="true"
          className={cn(
            'mt-0.5 size-4 shrink-0 text-muted-foreground',
            isHighRisk && 'text-destructive',
          )}
        />

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium text-foreground">{riskFactor.title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{description.concise}</p>

          {description.isTruncated ? (
            <details className="text-sm text-muted-foreground">
              <summary className="w-fit cursor-pointer font-medium text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Read full description
              </summary>
              <p className="mt-2 whitespace-pre-wrap leading-6">{riskFactor.description}</p>
            </details>
          ) : null}
        </div>
      </div>

      <div className="pl-6">
        <Badge variant={isHighRisk ? 'destructive' : 'outline'}>
          {formatSeverity(riskFactor.severity)}
        </Badge>
      </div>
    </li>
  );
}

export function RiskFactorsSection({ riskFactors }: RiskFactorsSectionProps) {
  const sortedRiskFactors = sortBySeverity(riskFactors);
  const highSeverityRisks = sortedRiskFactors.filter(
    (riskFactor) => riskFactor.severity === 'HIGH',
  );
  const otherRisks = sortedRiskFactors.filter((riskFactor) => riskFactor.severity !== 'HIGH');
  const visibleOtherRiskCount = Math.max(INITIAL_RISK_LIMIT - highSeverityRisks.length, 0);
  const visibleRisks = [...highSeverityRisks, ...otherRisks.slice(0, visibleOtherRiskCount)];
  const remainingRisks = otherRisks.slice(visibleOtherRiskCount);

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle as="h3" className="flex items-center gap-2 text-base">
          <ShieldAlert aria-hidden="true" className="size-4 text-primary" />
          What could make this wrong
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Conditions that could weaken or overturn the forecast.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {riskFactors.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">
            No known risk factors were identified. This does not mean the outcome is risk-free.
          </p>
        ) : (
          <>
            <ul className="space-y-3">
              {visibleRisks.map((riskFactor) => (
                <RiskFactorItem key={riskFactor.id} riskFactor={riskFactor} />
              ))}
            </ul>

            {remainingRisks.length > 0 ? (
              <details className="group rounded-lg border bg-muted/10 px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  View all risk factors ({riskFactors.length})
                </summary>
                <ul className="mt-4 space-y-3">
                  {remainingRisks.map((riskFactor) => (
                    <RiskFactorItem key={riskFactor.id} riskFactor={riskFactor} />
                  ))}
                </ul>
              </details>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
