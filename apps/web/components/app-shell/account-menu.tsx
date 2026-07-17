'use client';

import { useRouter } from 'next/navigation';
import { LoaderCircle, LogOut, Settings, UserRound } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth-store';

function getInitials(displayName: string | null, email: string): string {
  if (displayName) {
    const initials = displayName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    if (initials) {
      return initials;
    }
  }

  return email.charAt(0).toUpperCase() || 'U';
}

export function AccountMenu() {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);

  if (!user) {
    return null;
  }

  const displayName = user.displayName?.trim() || user.email;
  const initials = getInitials(user.displayName, user.email);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    await logout();
    router.replace('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Open account menu for ${displayName}`}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        disabled={isLoggingOut}
      >
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <div className="flex min-w-0 flex-col gap-0.5 px-2 py-2">
          <span className="truncate text-sm font-medium text-foreground">{displayName}</span>

          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled>
          <UserRound aria-hidden="true" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings aria-hidden="true" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
        >
          {isLoggingOut ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <LogOut aria-hidden="true" />
          )}
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
