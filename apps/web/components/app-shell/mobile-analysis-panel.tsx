'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';

import { AnalysisPanel } from '@/components/app-shell/analysis-panel';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type {
  AnalysisFormValues,
  AnalysisRequestRecord,
  AnalysisSubmissionStatus,
} from '@/types/analysis';

interface MobileAnalysisPanelProps {
  apiError: string | null;
  analysis: AnalysisRequestRecord | null;
  submittedValues: AnalysisFormValues | null;
  submissionStatus: AnalysisSubmissionStatus;
}

export function MobileAnalysisPanel({
  apiError,
  analysis,
  submittedValues,
  submissionStatus,
}: MobileAnalysisPanelProps) {
  const [open, setOpen] = useState(false);

  const hasActivity = submissionStatus !== 'idle' || Boolean(analysis);

  useEffect(() => {
    if (submissionStatus !== 'submitting') {
      return;
    }

    const isMobileOrTablet = window.matchMedia('(max-width: 1279px)').matches;

    if (isMobileOrTablet) {
      setOpen(true);
    }
  }, [submissionStatus]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
            aria-label="Open analysis summary"
          />
        }
      >
        <BarChart3 className="size-4" aria-hidden="true" />

        <span className="hidden sm:inline">Analysis</span>

        {hasActivity ? (
          <span
            className="size-2 rounded-full bg-emerald-500"
            aria-label="Analysis activity available"
          />
        ) : null}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[min(30rem,92vw)] gap-0 p-0 sm:max-w-[30rem]"
        showCloseButton
      >
        <SheetTitle className="sr-only">Analysis summary</SheetTitle>

        <SheetDescription className="sr-only">
          View the primary conclusion, probability, confidence, and recommended action. Open the
          complete result for evidence, risks, sources, and methodology.
        </SheetDescription>

        <AnalysisPanel
          analysis={analysis}
          submittedValues={submittedValues}
          submissionStatus={submissionStatus}
          apiError={apiError}
        />
      </SheetContent>
    </Sheet>
  );
}
