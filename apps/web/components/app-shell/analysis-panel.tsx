import Link from 'next/link';
import { ArrowRight, LoaderCircle, Sparkles } from 'lucide-react';

import { AnalysisResultView } from '@/components/analysis-results/analysis-result-view';
import { ResultEmptyState } from '@/components/analysis-results/result-empty-state';
import { ResultErrorState } from '@/components/analysis-results/result-error-state';
import { ResultLoadingState } from '@/components/analysis-results/result-loading-state';
import { Badge } from '@/components/ui/badge';
import type {
  AnalysisFormValues,
  AnalysisRequestRecord,
  AnalysisSubmissionStatus,
} from '@/types/analysis';

interface AnalysisPanelProps {
  apiError: string | null;
  analysis: AnalysisRequestRecord | null;
  submittedValues: AnalysisFormValues | null;
  submissionStatus: AnalysisSubmissionStatus;
}

function formatValue(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function AnalysisPanel({ analysis, submissionStatus, apiError }: AnalysisPanelProps) {
  const visibleStatus = analysis?.status ?? submissionStatus;
  const isFailed = submissionStatus === 'failed' || analysis?.status === 'FAILED';
  const isProcessing =
    submissionStatus === 'submitting' ||
    Boolean(analysis && analysis.status !== 'COMPLETED' && analysis.status !== 'FAILED');
  const isCompleted = analysis?.status === 'COMPLETED';

  const statusClassName = isFailed
    ? undefined
    : isProcessing
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : isCompleted
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-border bg-muted text-muted-foreground';

  return (
    <aside className="flex h-full flex-col bg-background">
      <div className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <Sparkles className="size-4" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">Analysis result</h2>
            <p className="truncate text-xs text-muted-foreground">
              Conclusion, probability, confidence, and action
            </p>
          </div>
        </div>

        <Badge variant={isFailed ? 'destructive' : 'secondary'} className={statusClassName}>
          {isProcessing ? (
            <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : null}

          {formatValue(visibleStatus)}
        </Badge>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {isFailed ? (
          <ResultErrorState
            title={analysis?.status === 'FAILED' ? 'Analysis failed' : 'Analysis request failed'}
            message={
              analysis?.status === 'FAILED'
                ? 'ForecastMe could not complete this analysis. No result was produced.'
                : (apiError ??
                  'The analysis request could not be completed. Review the form and try again.')
            }
          />
        ) : submissionStatus === 'submitting' ? (
          <ResultLoadingState status="submitting" />
        ) : analysis?.status === 'COMPLETED' && analysis.result ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Analysis question
              </p>

              <p className="mt-2 line-clamp-3 [overflow-wrap:anywhere] text-sm leading-6 text-foreground">
                {analysis.prompt}
              </p>
            </div>

            <AnalysisResultView
              result={analysis.result.content}
              domain={analysis.domain}
              variant="summary"
            />

            <Link
              href={`/history/${analysis.id}`}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              View complete result
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>

            <p className="text-center text-xs leading-5 text-muted-foreground">
              Evidence, risk factors, sources, and methodology are available in the complete result.
            </p>
          </div>
        ) : analysis?.status === 'COMPLETED' ? (
          <ResultEmptyState
            title="Result unavailable"
            description="The analysis completed, but no saved result was returned. ForecastMe will not invent missing result data."
          />
        ) : analysis ? (
          <ResultLoadingState status={analysis.status} />
        ) : (
          <ResultEmptyState
            title="No analysis selected"
            description="Configure and submit an analysis request to see its forecast summary here."
          />
        )}
      </div>
    </aside>
  );
}
