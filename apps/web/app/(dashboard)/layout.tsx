import { DashboardShell } from '@/components/app-shell/dashboard-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
