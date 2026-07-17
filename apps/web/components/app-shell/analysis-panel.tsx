import { AlertCircle, CheckCircle2, LoaderCircle, Paperclip } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type {
  AnalysisFormValues,
  AnalysisRequestRecord,
  AnalysisSubmissionStatus,
} from '@/types/analysis';

interface AnalysisPanelProps {
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

export function AnalysisPanel({ analysis, submittedValues, submissionStatus }: AnalysisPanelProps) {
  const visibleStatus = analysis?.status ?? submissionStatus;
  const isFailed = submissionStatus === 'failed' || analysis?.status === 'FAILED';

  return (
    <aside className="flex h-full flex-col bg-card">
      <div className="flex h-14 items-center justify-between px-4">
        <h2 className="font-medium">Analysis</h2>

        <Badge variant={isFailed ? 'destructive' : 'secondary'}>{formatValue(visibleStatus)}</Badge>
      </div>

      <Separator />

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {submissionStatus === 'idle' && !analysis ? (
          <div className="rounded-lg border border-dashed p-4">
            <p className="text-sm font-medium">No analysis selected</p>

            <p className="mt-2 text-sm text-muted-foreground">
              Submit an analysis request to view its status and request details.
            </p>
          </div>
        ) : null}

        {submissionStatus === 'submitting' ? (
          <div
            className="flex items-start gap-3 rounded-lg border p-4"
            role="status"
            aria-live="polite"
          >
            <LoaderCircle
              className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground"
              aria-hidden="true"
            />

            <div>
              <p className="text-sm font-medium">Submitting analysis</p>
              <p className="mt-1 text-sm text-muted-foreground">
                ForecastMe is creating your analysis request.
              </p>
            </div>
          </div>
        ) : null}

        {submissionStatus === 'failed' ? (
          <div
            className="rounded-lg border border-destructive/40 bg-destructive/5 p-4"
            role="alert"
          >
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <p className="text-sm font-medium">Submission failed</p>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Review the error message in the analysis form and try again.
            </p>
          </div>
        ) : null}

        {analysis && submittedValues ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />

                <div className="min-w-0">
                  <p className="text-sm font-medium">Analysis request created</p>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {analysis.id}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Question
                </p>
                <p className="mt-1 break-words text-sm">{analysis.prompt}</p>
              </div>

              <Separator />

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Domain</dt>
                  <dd className="mt-1 font-medium">{formatValue(analysis.domain)}</dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">Time horizon</dt>
                  <dd className="mt-1 font-medium">{formatValue(submittedValues.timeHorizon)}</dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">Risk preference</dt>
                  <dd className="mt-1 font-medium">
                    {formatValue(submittedValues.riskPreference)}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">Backend status</dt>
                  <dd className="mt-1 font-medium">{formatValue(analysis.status)}</dd>
                </div>
              </dl>
            </div>

            {submittedValues.attachment ? (
              <div className="rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <Paperclip
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {submittedValues.attachment.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Metadata saved. File upload and parsing are deferred.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
