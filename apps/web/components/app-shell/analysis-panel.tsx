import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Database,
  LoaderCircle,
  Paperclip,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

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

interface DetailRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

function formatValue(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-1 break-words text-sm font-semibold text-foreground">{value}</dd>
      </div>
    </div>
  );
}

export function AnalysisPanel({ analysis, submittedValues, submissionStatus }: AnalysisPanelProps) {
  const visibleStatus = analysis?.status ?? submissionStatus;
  const isFailed = submissionStatus === 'failed' || analysis?.status === 'FAILED';
  const isSubmitting = submissionStatus === 'submitting';
  const isCreated = Boolean(analysis && submittedValues);

  const statusClassName = isFailed
    ? undefined
    : isSubmitting
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : isCreated
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-border bg-muted text-muted-foreground';

  return (
    <aside className="flex h-full flex-col bg-background">
      <div className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <Sparkles className="size-4" aria-hidden="true" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">Analysis details</h2>
            <p className="text-xs text-muted-foreground">Request status and configuration</p>
          </div>
        </div>

        <Badge variant={isFailed ? 'destructive' : 'secondary'} className={statusClassName}>
          {isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}

          {formatValue(visibleStatus)}
        </Badge>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {submissionStatus === 'idle' && !analysis ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-dashed bg-muted/20 px-5 py-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                <CircleDashed className="size-6" aria-hidden="true" />
              </div>

              <h3 className="mt-4 text-base font-semibold text-foreground">No analysis selected</h3>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                Configure and submit an analysis request to see its status and request details here.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                What happens next
              </p>

              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium">Submit your question</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Choose the domain, time horizon, and risk preference.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium">Request processing</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      ForecastMe creates and tracks the analysis request.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium">Review the details</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      The submitted configuration and current status appear here.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {submissionStatus === 'submitting' ? (
          <div
            className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
              </div>

              <div>
                <p className="text-sm font-semibold text-amber-950">Submitting analysis</p>
                <p className="mt-1 text-sm leading-6 text-amber-900/70">
                  ForecastMe is creating and preparing your analysis request.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {submissionStatus === 'failed' ? (
          <div
            className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5"
            role="alert"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="size-5" aria-hidden="true" />
              </div>

              <div>
                <p className="text-sm font-semibold text-destructive">Submission failed</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Review the error shown in the analysis form and try submitting again.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {analysis && submittedValues ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="size-5" aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-emerald-950">Analysis request created</p>
                  <p className="mt-1 text-sm leading-6 text-emerald-900/70">
                    Your request was accepted and is ready for processing.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Analysis question
              </p>

              <p className="mt-3 break-words text-sm leading-6 text-foreground">
                {analysis.prompt}
              </p>

              <Separator className="my-5" />

              <dl className="space-y-5">
                <DetailRow icon={Database} label="Domain" value={formatValue(analysis.domain)} />

                <DetailRow
                  icon={Clock3}
                  label="Time horizon"
                  value={formatValue(submittedValues.timeHorizon)}
                />

                <DetailRow
                  icon={ShieldCheck}
                  label="Risk preference"
                  value={formatValue(submittedValues.riskPreference)}
                />

                <DetailRow
                  icon={CheckCircle2}
                  label="Request status"
                  value={formatValue(analysis.status)}
                />
              </dl>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Request identifier
              </p>

              <p className="mt-3 break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                {analysis.id}
              </p>
            </div>

            {submittedValues.attachment ? (
              <div className="rounded-2xl border bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Paperclip className="size-5" aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {submittedValues.attachment.name}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Attachment metadata saved. File upload and parsing remain deferred.
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
