'use client';

import { useState } from 'react';

import { AnalysisPanel } from '@/components/app-shell/analysis-panel';
import { AppHeader } from '@/components/app-shell/app-header';
import { AppSidebar } from '@/components/app-shell/app-sidebar';
import { ConversationWorkspace } from '@/components/app-shell/conversation-workspace';
import { createAnalysis } from '@/services/analysis-service';
import type {
  AnalysisFormValues,
  AnalysisRequestRecord,
  AnalysisSubmissionStatus,
  AttachmentMetadata,
  CreateAnalysisRequest,
} from '@/types/analysis';

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function createAttachmentMetadata(file: File): AttachmentMetadata {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    extension: getFileExtension(file.name),
  };
}

function createRequest(values: AnalysisFormValues): CreateAnalysisRequest {
  return {
    prompt: values.question.trim(),
    domain: values.domain,
    parameters: {
      timeHorizon: values.timeHorizon,
      riskPreference: values.riskPreference,
      ...(values.attachment ? { attachment: createAttachmentMetadata(values.attachment) } : {}),
    },
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Unable to submit the analysis request. Please try again.';
}

export function AppShell() {
  const [submissionStatus, setSubmissionStatus] = useState<AnalysisSubmissionStatus>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisRequestRecord | null>(null);
  const [submittedValues, setSubmittedValues] = useState<AnalysisFormValues | null>(null);

  const isSubmitting = submissionStatus === 'submitting';

  async function handleSubmit(values: AnalysisFormValues): Promise<void> {
    if (isSubmitting) {
      return;
    }

    setSubmissionStatus('submitting');
    setApiError(null);
    setAnalysis(null);
    setSubmittedValues(values);

    try {
      const createdAnalysis = await createAnalysis(createRequest(values));

      setAnalysis(createdAnalysis);
      setSubmissionStatus('succeeded');
    } catch (error) {
      setSubmissionStatus('failed');
      setApiError(getErrorMessage(error));
      throw error;
    }
  }

  function handleCancel(): void {
    setSubmissionStatus('idle');
    setApiError(null);
    setAnalysis(null);
    setSubmittedValues(null);
  }

  function handleClearApiError(): void {
    setApiError(null);

    setSubmissionStatus((currentStatus) => (currentStatus === 'failed' ? 'idle' : currentStatus));
  }
  return (
    <div className="h-dvh overflow-hidden bg-muted/30 text-foreground">
      <div className="grid h-full grid-cols-1 md:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="hidden min-h-0 md:block">
          <AppSidebar />
        </div>

        <div className="flex min-h-0 min-w-0 flex-col">
          <AppHeader
            analysis={analysis}
            submittedValues={submittedValues}
            submissionStatus={submissionStatus}
          />

          <main className="min-h-0 min-w-0 flex-1">
            <div className="grid h-full min-h-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_23rem]">
              <ConversationWorkspace
                isSubmitting={isSubmitting}
                apiError={apiError}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                onClearApiError={handleClearApiError}
              />

              <div className="hidden min-h-0 border-l bg-background xl:block">
                <AnalysisPanel
                  analysis={analysis}
                  submittedValues={submittedValues}
                  submissionStatus={submissionStatus}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
