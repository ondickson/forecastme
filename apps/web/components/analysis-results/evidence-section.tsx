import { CircleCheck, CircleX, ListChecks, Minus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EvidenceImpact, EvidenceItem, StrengthLevel } from '@/types/analysis';

interface EvidenceSectionProps {
  evidence: EvidenceItem[];
}

const impactLabels: Record<EvidenceImpact, string> = {
  SUPPORTS: 'Supports',
  OPPOSES: 'Opposes',
  NEUTRAL: 'Neutral',
};

function formatStrength(strength: StrengthLevel | null): string {
  if (!strength) {
    return 'Strength not available';
  }

  return `${strength.charAt(0)}${strength.slice(1).toLowerCase()} strength`;
}

function EvidenceImpactIcon({ impact }: { impact: EvidenceImpact | null }) {
  if (impact === 'SUPPORTS') {
    return <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-emerald-600" />;
  }

  if (impact === 'OPPOSES') {
    return <CircleX aria-hidden="true" className="size-4 shrink-0 text-destructive" />;
  }

  return <Minus aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />;
}

export function EvidenceSection({ evidence }: EvidenceSectionProps) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle as="h3" className="flex items-center gap-2 text-base">
          <ListChecks aria-hidden="true" className="size-4 text-primary" />
          Evidence
        </CardTitle>
      </CardHeader>

      <CardContent>
        {evidence.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">
            No verified evidence is available for this analysis.
          </p>
        ) : (
          <ul className="space-y-3">
            {evidence.map((item) => (
              <li key={item.id} className="space-y-2 rounded-lg border bg-muted/20 p-3">
                <div className="flex items-start gap-2">
                  <EvidenceImpactIcon impact={item.impact} />

                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>

                    <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pl-6">
                  <Badge variant="outline">
                    {item.impact ? impactLabels[item.impact] : 'Impact not available'}
                  </Badge>

                  <Badge variant="secondary">{formatStrength(item.strength)}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
