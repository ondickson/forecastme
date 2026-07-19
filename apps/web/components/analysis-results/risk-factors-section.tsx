import { ShieldAlert, TriangleAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RiskFactor, StrengthLevel } from '@/types/analysis';

interface RiskFactorsSectionProps {
  riskFactors: RiskFactor[];
}

function formatSeverity(severity: StrengthLevel | null): string {
  if (!severity) {
    return 'Severity not available';
  }

  return `${severity.charAt(0)}${severity.slice(1).toLowerCase()} severity`;
}

export function RiskFactorsSection({ riskFactors }: RiskFactorsSectionProps) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle as="h3" className="flex items-center gap-2 text-base">
          <ShieldAlert aria-hidden="true" className="size-4 text-primary" />
          Risk factors
        </CardTitle>
      </CardHeader>

      <CardContent>
        {riskFactors.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">
            No known risk factors were identified. This does not mean the outcome is risk-free.
          </p>
        ) : (
          <ul className="space-y-3">
            {riskFactors.map((riskFactor) => {
              const isHighRisk = riskFactor.severity === 'HIGH';

              return (
                <li
                  key={riskFactor.id}
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

                      <p className="text-sm leading-6 text-muted-foreground">
                        {riskFactor.description}
                      </p>
                    </div>
                  </div>

                  <div className="pl-6">
                    <Badge variant={isHighRisk ? 'destructive' : 'outline'}>
                      {formatSeverity(riskFactor.severity)}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
