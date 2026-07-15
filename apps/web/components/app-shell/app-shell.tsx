import { AnalysisPanel } from '@/components/app-shell/analysis-panel';
import { AppHeader } from '@/components/app-shell/app-header';
import { AppSidebar } from '@/components/app-shell/app-sidebar';
import { ConversationWorkspace } from '@/components/app-shell/conversation-workspace';

export function AppShell() {
  return (
    <div className="h-dvh overflow-hidden bg-background text-foreground">
      <div className="grid h-full grid-cols-1 md:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="hidden min-h-0 md:block">
          <AppSidebar />
        </div>

        <div className="flex min-h-0 min-w-0 flex-col">
          <AppHeader />

          <main className="min-h-0 min-w-0 flex-1">
            <div className="grid h-full min-h-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <ConversationWorkspace />

              <div className="hidden min-h-0 border-l xl:block">
                <AnalysisPanel />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
