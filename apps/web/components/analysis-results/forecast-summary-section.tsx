import { CircleAlert, ShieldCheck } from 'lucide-react';

import { ProbabilityVisual } from '@/components/analysis-results/probability-visual';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatPercentage, UNAVAILABLE_RESULT_VALUE } from '@/lib/analysis/result-formatters';
import type { AnalysisConfidence, AnalysisDomain } from '@/types/analysis';

type DecisionLabel = 'ACT' | 'CONSIDER' | 'WATCH' | 'PASS' | 'INSUFFICIENT DATA';
type ForecastSummaryVariant = 'full' | 'compact';

interface ForecastSummarySectionProps {
  directAnswer: string;
  probability: number | null;
  confidence: AnalysisConfidence;
  suggestedAction: string | null;
  domain: AnalysisDomain;
  variant?: ForecastSummaryVariant;
}

function formatConfidenceLevel(level: AnalysisConfidence['level']): string {
  if (!level) {
    return UNAVAILABLE_RESULT_VALUE;
  }

  return `${level.charAt(0)}${level.slice(1).toLowerCase()}`;
}

function getConciseText(value: string, sentenceLimit = 2, characterLimit = 280): string {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return '';
  }

  const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [normalized];
  const concise = sentences.slice(0, sentenceLimit).join(' ').trim();

  if (concise.length <= characterLimit) {
    return concise;
  }

  const shortened = concise.slice(0, characterLimit + 1);
  const lastSpace = shortened.lastIndexOf(' ');

  return `${shortened.slice(0, lastSpace > 0 ? lastSpace : characterLimit).trimEnd()}…`;
}

function getDecisionLabel(suggestedAction: string | null): DecisionLabel {
  const action = suggestedAction?.trim();

  if (!action) {
    return 'INSUFFICIENT DATA';
  }

  const explicitLabel = action.match(
    /^(ACT|CONSIDER|WATCH|PASS|INSUFFICIENT DATA)\b(?:\s*[:—-]\s*)?/i,
  )?.[1];

  if (explicitLabel) {
    return explicitLabel.toUpperCase() as DecisionLabel;
  }

  if (/^(insufficient|not enough|cannot recommend|no responsible action)\b/i.test(action)) {
    return 'INSUFFICIENT DATA';
  }

  if (/^(pass|avoid|decline|skip|do not proceed)\b/i.test(action)) {
    return 'PASS';
  }

  if (/^(watch|monitor|wait|observe|reassess)\b/i.test(action)) {
    return 'WATCH';
  }

  if (/^(act|proceed|move forward|implement|take action)\b/i.test(action)) {
    return 'ACT';
  }

  return 'CONSIDER';
}

function getActionText(suggestedAction: string | null): string {
  const action = suggestedAction?.trim();

  if (!action) {
    return 'Gather more reliable information before choosing a course of action.';
  }

  const withoutLabel = action
    .replace(/^(ACT|CONSIDER|WATCH|PASS|INSUFFICIENT DATA)\b(?:\s*[:—-]\s*)?/i, '')
    .trim();

  return withoutLabel || 'Review the analysis details before choosing a course of action.';
}

function getActionHeading(domain: AnalysisDomain): string {
  if (domain === 'GENERAL_RESEARCH' || domain === 'CUSTOM_DATASET') {
    return 'Recommended next step';
  }

  return 'Recommended action';
}

export function ForecastSummarySection({
  directAnswer,
  probability,
  confidence,
  suggestedAction,
  domain,
  variant = 'full',
}: ForecastSummarySectionProps) {
  const fullConclusion =
    directAnswer.trim() || 'No reliable conclusion is available for this analysis.';
  const conciseConclusion = getConciseText(fullConclusion);
  const hasAdditionalConclusion = conciseConclusion !== fullConclusion;
  const formattedConfidenceScore = formatPercentage(confidence.score, 1);
  const formattedConfidenceLevel = formatConfidenceLevel(confidence.level);
  const explanation = getConciseText(
    confidence.explanation?.trim() ||
      (formattedConfidenceLevel === UNAVAILABLE_RESULT_VALUE
        ? 'ForecastMe could not determine a reliable confidence level from the available information.'
        : 'Confidence reflects the reliability of this estimate, not the likelihood of the outcome.'),
  );
  const action = getActionText(suggestedAction);
  const decision = getDecisionLabel(suggestedAction);
  const showFinancialRiskNotice = domain === 'FINANCIAL_MARKET';
  const isCompact = variant === 'compact';

  return (
    <>
      <Card className="border-primary/30 bg-primary/5 shadow-sm">
        <CardHeader className="gap-3 border-b border-primary/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold leading-none">Forecast summary</h2>
            <Badge variant={decision === 'ACT' ? 'default' : 'outline'}>{decision}</Badge>
          </div>

          <p className="max-w-3xl [overflow-wrap:anywhere] text-base font-medium leading-7 text-foreground sm:text-lg">
            {conciseConclusion}
          </p>
        </CardHeader>

        <CardContent className={isCompact ? 'space-y-4 pt-4' : 'space-y-5 pt-5'}>
          <div className={isCompact ? 'grid grid-cols-2 gap-3' : 'grid gap-4 sm:grid-cols-2'}>
            <ProbabilityVisual
              outcomes={[{ label: 'Predicted outcome', probability }]}
              variant={isCompact ? 'compact' : 'full'}
            />

            <section
              aria-label="Forecast confidence"
              className={
                isCompact
                  ? 'min-w-0 rounded-lg border bg-background/80 p-3'
                  : 'rounded-lg border bg-background/80 p-4'
              }
            >
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-primary" />
                <span className={isCompact ? 'truncate' : undefined}>Forecast confidence</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p
                  className={
                    isCompact
                      ? 'text-2xl font-semibold tracking-tight text-foreground'
                      : 'text-3xl font-semibold tracking-tight text-foreground'
                  }
                >
                  <span className="sr-only">Forecast confidence score: </span>
                  {formattedConfidenceScore}
                </p>

                {formattedConfidenceLevel !== UNAVAILABLE_RESULT_VALUE ? (
                  <Badge variant="outline">{formattedConfidenceLevel}</Badge>
                ) : null}
              </div>

              {!isCompact ? (
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Reliability of the estimate—not the chance that the outcome occurs.
                </p>
              ) : null}
            </section>
          </div>

          {!isCompact ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{explanation}</p>
          ) : null}

          <div className="rounded-lg border border-primary/20 bg-background/80 p-4">
            <p className="text-sm font-medium text-foreground">{getActionHeading(domain)}</p>

            <p className="mt-2 whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-6 text-foreground">
              {action}
            </p>
          </div>

          {showFinancialRiskNotice ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-background/70 p-3">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-xs leading-5 text-muted-foreground">
                {isCompact
                  ? 'This is not financial advice. Verify the information before risking money.'
                  : 'This is not financial advice. Financial markets can result in substantial losses. Verify the information and consider qualified professional advice before risking money.'}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {!isCompact && hasAdditionalConclusion ? (
        <details className="group rounded-lg border bg-card px-4 py-3 text-card-foreground">
          <summary className="cursor-pointer rounded-sm text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            Full conclusion
          </summary>
          <p className="mt-3 whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-6 text-muted-foreground">
            {fullConclusion}
          </p>
        </details>
      ) : null}
    </>
  );
}
