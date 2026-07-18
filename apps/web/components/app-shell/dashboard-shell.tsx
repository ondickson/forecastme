import { AppSidebar } from '@/components/app-shell/app-sidebar';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="h-dvh overflow-hidden bg-muted/30 text-foreground">
      <div className="grid h-full grid-cols-1 md:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="hidden min-h-0 md:block">
          <AppSidebar />
        </div>

        <div className="min-h-0 min-w-0">{children}</div>
      </div>
    </div>
  );
}
