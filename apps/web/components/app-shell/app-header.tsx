import { Sparkles } from 'lucide-react';

import { AccountMenu } from '@/components/app-shell/account-menu';
import { MobileNavigation } from '@/components/app-shell/mobile-navigation';
import { MobileAnalysisPanel } from '@/components/app-shell/mobile-analysis-panel';
import type {
  AnalysisFormValues,
  AnalysisRequestRecord,
  AnalysisSubmissionStatus,
} from '@/types/analysis';

interface AppHeaderProps {
  analysis: AnalysisRequestRecord | null;
  submittedValues: AnalysisFormValues | null;
  submissionStatus: AnalysisSubmissionStatus;
}

export function AppHeader({ analysis, submittedValues, submissionStatus }: AppHeaderProps) {
  const mobileAnalysisPanel = (
    <MobileAnalysisPanel
      analysis={analysis}
      submittedValues={submittedValues}
      submissionStatus={submissionStatus}
    />
  );

 return (
    <header className="flex h-16 shrink-0 items-center border-b bg-background/95 px-4 backdrop-blur sm:px-6">
      <div className="hidden w-full items-center justify-between md:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <Sparkles className="size-4" aria-hidden="true" />
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Analysis workspace</p>
            <p className="text-xs text-muted-foreground">
              Turn questions into decision-ready intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mobileAnalysisPanel}
          <AccountMenu />
        </div>
      </div>

      <div className="flex w-full items-center justify-between md:hidden">
        <div className="flex items-center gap-3">
          <MobileNavigation />

          <div>
            <p className="text-sm font-semibold">ForecastMe</p>
            <p className="text-xs text-muted-foreground">Analysis workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mobileAnalysisPanel}
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
