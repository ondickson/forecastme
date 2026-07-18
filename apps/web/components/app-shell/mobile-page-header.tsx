import { MobileNavigation } from '@/components/app-shell/mobile-navigation';

interface MobilePageHeaderProps {
  title: string;
  description: string;
}

export function MobilePageHeader({ title, description }: MobilePageHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center border-b bg-background px-4 md:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNavigation />

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </header>
  );
}
