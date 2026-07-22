import { EvidenceSection } from '@/components/analysis-results/evidence-section';
import { ForecastSummarySection } from '@/components/analysis-results/forecast-summary-section';
import { RiskFactorsSection } from '@/components/analysis-results/risk-factors-section';
import { TechnicalDetailsSection } from '@/components/analysis-results/technical-details-section';
import { cn } from '@/lib/utils';
import type { AnalysisDomain, AnalysisResult } from '@/types/analysis';

interface AnalysisResultViewProps {
  result: AnalysisResult;
  domain: AnalysisDomain;
  className?: string;
  variant?: 'full' | 'summary';
}

export function AnalysisResultView({
  result,
  domain,
  className,
  variant = 'full',
}: AnalysisResultViewProps) {
  const isSummary = variant === 'summary';

  return (
    <section
      aria-label={isSummary ? 'Analysis result summary' : 'Analysis result'}
      className={cn('space-y-4', className)}
    >
      <ForecastSummarySection
        directAnswer={result.directAnswer}
        probability={result.probability}
        confidence={result.confidence}
        suggestedAction={result.suggestedAction}
        domain={domain}
        variant={isSummary ? 'compact' : 'full'}
      />

      {!isSummary ? (
        <>
          <EvidenceSection evidence={result.evidence} sources={result.sources} />
          <RiskFactorsSection riskFactors={result.riskFactors} />
          <TechnicalDetailsSection
            sources={result.sources}
            model={result.model}
            dataFreshness={result.dataFreshness}
          />
        </>
      ) : null}
    </section>
  );
}
