import { AccountMenu } from '@/components/app-shell/account-menu';
import { MobileNavigation } from '@/components/app-shell/mobile-navigation';
import { MobileAnalysisPanel } from '@/components/app-shell/mobile-analysis-panel';

export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center border-b bg-background px-4">
      <div className="hidden w-full items-center justify-between md:flex">
        <span className="text-lg font-semibold">ForecastMe</span>

        <div className="flex items-center gap-2">
          <MobileAnalysisPanel />
          <AccountMenu />
        </div>
      </div>

      <div className="flex w-full items-center gap-2 md:hidden">
        <MobileNavigation />

        <span className="min-w-0 flex-1 truncate text-center text-lg font-semibold">
          ForecastMe
        </span>

        <MobileAnalysisPanel />
        <AccountMenu />
      </div>
    </header>
  );
}
