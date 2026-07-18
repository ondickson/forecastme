import { MobileAnalysisPanel } from '@/components/app-shell/mobile-analysis-panel';
import { MobileNavigation } from '@/components/app-shell/mobile-navigation';
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

export function AppHeader({
  analysis,
  submittedValues,
  submissionStatus,
}: AppHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center border-b bg-background px-4 md:hidden">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNavigation />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">ForecastMe</p>
            <p className="truncate text-xs text-muted-foreground">
              Analysis workspace
            </p>
          </div>
        </div>

        <MobileAnalysisPanel
          analysis={analysis}
          submittedValues={submittedValues}
          submissionStatus={submissionStatus}
        />
      </div>
    </header>
  );
}