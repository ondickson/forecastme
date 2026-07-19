import { MobileAnalysisPanel } from '@/components/app-shell/mobile-analysis-panel';
import { MobileNavigation } from '@/components/app-shell/mobile-navigation';
import type {
  AnalysisFormValues,
  AnalysisRequestRecord,
  AnalysisSubmissionStatus,
} from '@/types/analysis';

interface AppHeaderProps {
  apiError: string | null;
  analysis: AnalysisRequestRecord | null;
  submittedValues: AnalysisFormValues | null;
  submissionStatus: AnalysisSubmissionStatus;
}

export function AppHeader({
  analysis,
  submittedValues,
  submissionStatus,
  apiError,
}: AppHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center border-b bg-background px-4 supports-[-webkit-touch-callout:none]:h-[calc(4rem+max(env(safe-area-inset-top),1.5rem))] supports-[-webkit-touch-callout:none]:pt-[max(env(safe-area-inset-top),1.5rem)] xl:hidden">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNavigation />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">ForecastMe</p>
            <p className="truncate text-xs text-muted-foreground">Analysis workspace</p>
          </div>
        </div>

        <MobileAnalysisPanel
          analysis={analysis}
          submittedValues={submittedValues}
          submissionStatus={submissionStatus}
          apiError={apiError}
        />
      </div>
    </header>
  );
}
