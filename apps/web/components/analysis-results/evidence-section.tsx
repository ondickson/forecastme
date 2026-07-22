import { CircleCheck, CircleX, ListChecks, Minus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalysisSource, EvidenceImpact, EvidenceItem, StrengthLevel } from '@/types/analysis';

interface EvidenceSectionProps {
  evidence: EvidenceItem[];
  sources: AnalysisSource[];
}

const FEATURED_EVIDENCE_LIMIT = 3;

const impactLabels: Record<EvidenceImpact, string> = {
  SUPPORTS: 'Supports',
  OPPOSES: 'Opposes',
  NEUTRAL: 'Context',
};

const strengthRank: Record<StrengthLevel, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function formatStrength(strength: StrengthLevel | null): string {
  if (!strength) {
    return 'Strength unavailable';
  }

  return `${strength.charAt(0)}${strength.slice(1).toLowerCase()} strength`;
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

function sortByStrength(items: readonly EvidenceItem[]): EvidenceItem[] {
  return [...items].sort(
    (left, right) =>
      (right.strength ? strengthRank[right.strength] : 0) -
      (left.strength ? strengthRank[left.strength] : 0),
  );
}

function getFeaturedEvidence(evidence: readonly EvidenceItem[]): EvidenceItem[] {
  const supporting = sortByStrength(evidence.filter((item) => item.impact === 'SUPPORTS'));
  const opposing = sortByStrength(evidence.filter((item) => item.impact === 'OPPOSES'));
  const featured: EvidenceItem[] = [];

  if (supporting[0]) {
    featured.push(supporting[0]);
  }

  if (opposing[0]) {
    featured.push(opposing[0]);
  }

  const remaining = sortByStrength(evidence).filter(
    (item) => !featured.some((featuredItem) => featuredItem.id === item.id),
  );

  featured.push(...remaining.slice(0, FEATURED_EVIDENCE_LIMIT - featured.length));

  return featured;
}

function getSourceSummary(sources: readonly AnalysisSource[]): string | null {
  const labels = sources
    .map((source) => source.publisher?.trim() || source.title.trim())
    .filter((label, index, allLabels) => label && allLabels.indexOf(label) === index);

  if (labels.length === 0) {
    return null;
  }

  const shownLabels = labels.slice(0, 3);
  const remainingCount = labels.length - shownLabels.length;

  return `${shownLabels.join(', ')}${remainingCount > 0 ? ` and ${remainingCount} more` : ''}`;
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

function EvidenceItemCard({
  item,
  showSourceLink,
}: {
  item: EvidenceItem;
  showSourceLink: boolean;
}) {
  const description = getConciseText(item.description);

  return (
    <li className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-start gap-2">
        <EvidenceImpactIcon impact={item.impact} />

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{description.concise}</p>

          {description.isTruncated ? (
            <details className="text-sm text-muted-foreground">
              <summary className="w-fit cursor-pointer font-medium text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Read full description
              </summary>
              <p className="mt-2 whitespace-pre-wrap leading-6">{item.description}</p>
            </details>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-6">
        <Badge variant="outline">
          {item.impact ? impactLabels[item.impact] : 'Impact unavailable'}
        </Badge>
        <Badge variant="secondary">{formatStrength(item.strength)}</Badge>

        {showSourceLink ? (
          <a
            href="#analysis-sources"
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Source details
          </a>
        ) : null}
      </div>
    </li>
  );
}

function EvidenceGroup({
  title,
  items,
  showSourceLinks,
}: {
  title: string;
  items: readonly EvidenceItem[];
  showSourceLinks: boolean;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-label={title} className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <ul className="space-y-3">
        {items.map((item) => (
          <EvidenceItemCard key={item.id} item={item} showSourceLink={showSourceLinks} />
        ))}
      </ul>
    </section>
  );
}

function EvidenceGroups({
  items,
  showSourceLinks,
}: {
  items: readonly EvidenceItem[];
  showSourceLinks: boolean;
}) {
  return (
    <div className="space-y-4">
      <EvidenceGroup
        title="Supporting evidence"
        items={items.filter((item) => item.impact === 'SUPPORTS')}
        showSourceLinks={showSourceLinks}
      />
      <EvidenceGroup
        title="Opposing evidence"
        items={items.filter((item) => item.impact === 'OPPOSES')}
        showSourceLinks={showSourceLinks}
      />
      <EvidenceGroup
        title="Additional context"
        items={items.filter((item) => item.impact !== 'SUPPORTS' && item.impact !== 'OPPOSES')}
        showSourceLinks={showSourceLinks}
      />
    </div>
  );
}

export function EvidenceSection({ evidence, sources }: EvidenceSectionProps) {
  const featuredEvidence = getFeaturedEvidence(evidence);
  const featuredIds = new Set(featuredEvidence.map((item) => item.id));
  const remainingEvidence = sortByStrength(evidence.filter((item) => !featuredIds.has(item.id)));
  const sourceSummary = getSourceSummary(sources);
  const hasSources = sources.length > 0;

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle as="h3" className="flex items-center gap-2 text-base">
          <ListChecks aria-hidden="true" className="size-4 text-primary" />
          Evidence
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Strongest available reasons for and against the forecast.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {evidence.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">
            No verified evidence is available for this analysis.
          </p>
        ) : (
          <>
            {sourceSummary ? (
              <p className="text-xs leading-5 text-muted-foreground">
                Analysis sources: {sourceSummary}. Exact item-level attribution is not available.{' '}
                <a
                  href="#analysis-sources"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  View sources
                </a>
              </p>
            ) : null}

            <EvidenceGroups items={featuredEvidence} showSourceLinks={hasSources} />

            {remainingEvidence.length > 0 ? (
              <details className="group rounded-lg border bg-muted/10 px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  View all evidence ({evidence.length})
                </summary>
                <div className="mt-4">
                  <EvidenceGroups items={remainingEvidence} showSourceLinks={hasSources} />
                </div>
              </details>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
