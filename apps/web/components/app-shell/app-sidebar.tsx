'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Sparkles } from 'lucide-react';
import { AccountMenu } from '@/components/app-shell/account-menu';
import { navigationSections } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const displayName = user?.displayName?.trim() || 'ForecastMe user';
  const email = user?.email || 'No email available';

  return (
    <aside
      aria-label="Primary navigation"
      className="flex h-full min-h-0 flex-col border-r bg-background text-foreground"
    >
      <div className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-700 text-white shadow-sm">
          <BarChart3 className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-base font-bold tracking-tight">ForecastMe</p>
          <p className="truncate text-xs text-muted-foreground">Predictive intelligence</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-6">
          {navigationSections.map((section) => (
            <div key={section.title}>
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {section.title}
              </p>

              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600',
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                          isActive
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-muted text-muted-foreground group-hover:text-foreground',
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>

                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="shrink-0 border-t p-3">
        <div className="rounded-xl bg-indigo-50 p-4 text-indigo-950">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-indigo-700" aria-hidden="true" />
            <p className="text-sm font-semibold">Decision intelligence</p>
          </div>

          <p className="mt-2 text-xs leading-5 text-indigo-900/70">
            Research, datasets, sports, and markets in one workspace.
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground" title={displayName}>
              {displayName}
            </p>

            <p className="truncate text-xs text-muted-foreground" title={email}>
              {email}
            </p>
          </div>

          <AccountMenu />
        </div>
      </div>
    </aside>
  );
}
