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
  analysis: AnalysisRequestRecord | null;
  submittedValues: AnalysisFormValues | null;
  submissionStatus: AnalysisSubmissionStatus;
}

export function MobileAnalysisPanel({
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
            className="gap-2 border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 xl:hidden"
            aria-label="Open analysis panel"
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
        className="w-[min(26rem,88vw)] gap-0 p-0 sm:max-w-[26rem]"
        showCloseButton
      >
        <SheetTitle className="sr-only">Analysis details</SheetTitle>

        <SheetDescription className="sr-only">
          View the submitted analysis request and its current status.
        </SheetDescription>

        <AnalysisPanel
          analysis={analysis}
          submittedValues={submittedValues}
          submissionStatus={submissionStatus}
        />
      </SheetContent>
    </Sheet>
  );
}
