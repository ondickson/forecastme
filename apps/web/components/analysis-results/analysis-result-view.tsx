import { ConfidenceSection } from '@/components/analysis-results/confidence-section';
import { DataFreshnessSection } from '@/components/analysis-results/data-freshness-section';
import { DirectAnswerSection } from '@/components/analysis-results/direct-answer-section';
import { EvidenceSection } from '@/components/analysis-results/evidence-section';
import { ModelInformationSection } from '@/components/analysis-results/model-information-section';
import { ProbabilitySection } from '@/components/analysis-results/probability-section';
import { RiskFactorsSection } from '@/components/analysis-results/risk-factors-section';
import { SourcesSection } from '@/components/analysis-results/sources-section';
import { SuggestedActionSection } from '@/components/analysis-results/suggested-action-section';
import { cn } from '@/lib/utils';
import type { AnalysisDomain, AnalysisResult } from '@/types/analysis';

interface AnalysisResultViewProps {
  result: AnalysisResult;
  domain: AnalysisDomain;
  className?: string;
}

export function AnalysisResultView({ result, domain, className }: AnalysisResultViewProps) {
  const showFinancialRiskNotice = domain === 'FINANCIAL_MARKET';

  return (
    <section aria-label="Analysis result" className={cn('space-y-4', className)}>
      <DirectAnswerSection directAnswer={result.directAnswer} />

      <div className="grid gap-4 sm:grid-cols-2">
        <ProbabilitySection probability={result.probability} />
        <ConfidenceSection confidence={result.confidence} />
      </div>

      <EvidenceSection evidence={result.evidence} />
      <RiskFactorsSection riskFactors={result.riskFactors} />

      <SuggestedActionSection
        suggestedAction={result.suggestedAction}
        showFinancialRiskNotice={showFinancialRiskNotice}
      />

      <SourcesSection sources={result.sources} />

      <div className="grid gap-4">
        <ModelInformationSection model={result.model} />
        <DataFreshnessSection dataFreshness={result.dataFreshness} />
      </div>
    </section>
  );
}
