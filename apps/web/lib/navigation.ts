import type { LucideIcon } from 'lucide-react';
import { Brain, Database, Files, SquarePen } from 'lucide-react';

export interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export const navigationSections: NavigationSection[] = [
  {
    title: 'Workspace',
    items: [
      {
        title: 'New Analysis',
        href: '/',
        icon: SquarePen,
      },
      {
        title: 'Analyses',
        href: '/history',
        icon: Files,
      },
    ],
  },
  {
    title: 'Data',
    items: [
      {
        title: 'Datasets',
        href: '/datasets',
        icon: Database,
      },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      {
        title: 'Models',
        href: '/models',
        icon: Brain,
      },
    ],
  },
];

export const navigationItems: NavigationItem[] = navigationSections.flatMap(
  (section) => section.items,
);
