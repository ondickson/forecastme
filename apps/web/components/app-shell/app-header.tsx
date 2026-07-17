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
    <header className="flex h-14 shrink-0 items-center border-b bg-background px-4">
      <div className="hidden w-full items-center md:flex justify-end">
        <div className="flex items-center gap-2">
          {mobileAnalysisPanel}
          <AccountMenu />
        </div>
      </div>

      <div className="flex w-full items-center gap-2 md:hidden">
        <MobileNavigation />

        {mobileAnalysisPanel}
        <AccountMenu />
      </div>
    </header>
  );
}
