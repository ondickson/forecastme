'use client';

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

export function MobileAnalysisPanel() {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 xl:hidden"
            aria-label="Open analysis panel"
          />
        }
      >
        <BarChart3 className="size-4" aria-hidden="true" />
        Analysis
      </SheetTrigger>

      <SheetContent side="right" className="w-[min(24rem,90vw)] gap-0 p-0" showCloseButton>
        <SheetTitle className="sr-only">Analysis details</SheetTitle>
        <SheetDescription className="sr-only">
          View probability estimates, confidence scores, risk indicators, and supporting metadata.
        </SheetDescription>

        <AnalysisPanel />
      </SheetContent>
    </Sheet>
  );
}
