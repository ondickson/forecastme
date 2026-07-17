import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/app-shell/app-shell';

export default function Home() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  );
}
