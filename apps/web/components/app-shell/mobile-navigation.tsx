'use client';

import { useState } from 'react';
import { MenuIcon } from 'lucide-react';

import { AppSidebar } from '@/components/app-shell/app-sidebar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function MobileNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button type="button" variant="ghost" size="icon" aria-label="Open navigation menu" />
        }
      >
        <MenuIcon className="size-4" aria-hidden="true" />
      </SheetTrigger>

      <SheetContent side="left" className="w-72 gap-0 p-0 sm:max-w-72" showCloseButton={false}>
        <SheetTitle className="sr-only">ForecastMe navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Navigate between ForecastMe application sections.
        </SheetDescription>

        <AppSidebar onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
