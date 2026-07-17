'use client';

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
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">New Analysis</h1>

        <p className="mt-1 text-sm text-muted-foreground">Ask ForecastMe a question.</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <AnalysisInputForm
          isSubmitting={isSubmitting}
          apiError={apiError}
          onSubmit={onSubmit}
          onCancel={onCancel}
          onClearApiError={onClearApiError}
        />
      </div>
    </section>
  );
}
