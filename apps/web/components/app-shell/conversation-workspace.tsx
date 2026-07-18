'use client';

import { Sparkles } from 'lucide-react';

import { AnalysisInputForm } from '@/components/analysis/analysis-input-form';
import type { AnalysisFormValues } from '@/types/analysis';

interface ConversationWorkspaceProps {
  isSubmitting: boolean;
  apiError: string | null;
  onSubmit: (values: AnalysisFormValues) => Promise<void>;
  onCancel: () => void;
  onClearApiError: () => void;
}

export function ConversationWorkspace({
  isSubmitting,
  apiError,
  onSubmit,
  onCancel,
  onClearApiError,
}: ConversationWorkspaceProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <div className="shrink-0 border-b bg-background px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">New Analysis</h1>

              <p className="mt-1 max-w-2xl text-base leading-6 text-muted-foreground">
                Ask a question, configure the analysis, and generate decision-ready intelligence.
              </p>
            </div>
          </div>

          <span className="hidden rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
            New request
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-4xl rounded-2xl border bg-background p-5 shadow-sm sm:p-7 lg:p-8">
          <AnalysisInputForm
            isSubmitting={isSubmitting}
            apiError={apiError}
            onSubmit={onSubmit}
            onCancel={onCancel}
            onClearApiError={onClearApiError}
          />
        </div>
      </div>
    </section>
  );
}
