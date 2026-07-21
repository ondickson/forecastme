'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AnalysisPanel } from '@/components/app-shell/analysis-panel';
import { AppHeader } from '@/components/app-shell/app-header';
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
  const router = useRouter();
  const submissionInFlightRef = useRef(false);

  const [submissionStatus, setSubmissionStatus] = useState<AnalysisSubmissionStatus>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisRequestRecord | null>(null);
  const [submittedValues, setSubmittedValues] = useState<AnalysisFormValues | null>(null);
  const [duplicateAnalysis, setDuplicateAnalysis] = useState<AnalysisRequestRecord | null>(null);
  const [duplicateValues, setDuplicateValues] = useState<AnalysisFormValues | null>(null);

  const isSubmitting = submissionStatus === 'submitting';

  async function submitRequest(values: AnalysisFormValues, allowDuplicate: boolean): Promise<void> {
    if (submissionInFlightRef.current) {
      return;
    }

    submissionInFlightRef.current = true;
    setSubmissionStatus('submitting');
    setApiError(null);
    setAnalysis(null);
    setSubmittedValues(values);

    try {
      const request = createRequest(values);

      if (allowDuplicate) {
        request.allowDuplicate = true;
      }

      const response = await createAnalysis(request);

      if (response.duplicate && !allowDuplicate) {
        setDuplicateAnalysis(response.analysis);
        setDuplicateValues(values);
        setSubmissionStatus('idle');
        return;
      }

      setDuplicateAnalysis(null);
      setDuplicateValues(null);
      setAnalysis(response.analysis);
      setSubmissionStatus('succeeded');
    } catch (error) {
      setSubmissionStatus('failed');
      setApiError(getErrorMessage(error));
      throw error;
    } finally {
      submissionInFlightRef.current = false;
    }
  }

  async function handleSubmit(values: AnalysisFormValues): Promise<void> {
    await submitRequest(values, false);
  }

  async function handleRunAgain(): Promise<void> {
    const values = duplicateValues;

    if (!values) {
      return;
    }

    setDuplicateAnalysis(null);
    setDuplicateValues(null);

    try {
      await submitRequest(values, true);
    } catch {
      // submitRequest exposes the normalized error through apiError.
    }
  }

  function handleViewExisting(): void {
    if (!duplicateAnalysis) {
      return;
    }

    const analysisId = duplicateAnalysis.id;

    setDuplicateAnalysis(null);
    setDuplicateValues(null);
    router.push(`/history/${analysisId}`);
  }

  function handleDuplicateDialogOpenChange(open: boolean): void {
    if (!open && !isSubmitting) {
      setDuplicateAnalysis(null);
      setDuplicateValues(null);
    }
  }

  function handleCancel(): void {
    setSubmissionStatus('idle');
    setApiError(null);
    setAnalysis(null);
    setSubmittedValues(null);
    setDuplicateAnalysis(null);
    setDuplicateValues(null);
  }

  function handleClearApiError(): void {
    setApiError(null);

    setSubmissionStatus((currentStatus) => (currentStatus === 'failed' ? 'idle' : currentStatus));
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <AppHeader
        analysis={analysis}
        submittedValues={submittedValues}
        submissionStatus={submissionStatus}
        apiError={apiError}
      />

      <main className="min-h-0 min-w-0 flex-1">
        <div className="grid h-full min-h-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_30rem]">
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
              apiError={apiError}
            />
          </div>
        </div>
      </main>

      <Dialog open={duplicateAnalysis !== null} onOpenChange={handleDuplicateDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Analysis already submitted</DialogTitle>

            <DialogDescription>
              You submitted an identical analysis within the last 10 minutes. You can open the
              existing result or intentionally run it again.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Keep editing
            </DialogClose>

            <Button type="button" variant="outline" onClick={handleViewExisting}>
              View existing
            </Button>

            <Button type="button" onClick={() => void handleRunAgain()}>
              Run again anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
