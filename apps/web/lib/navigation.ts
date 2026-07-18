import { Brain, Database, History, SquarePen } from 'lucide-react';

export const navigationItems = [
  {
    title: 'New Analysis',
    href: '/',
    icon: SquarePen,
  },
  {
    title: 'History',
    href: '/history',
    icon: History,
  },
  {
    title: 'Datasets',
    href: '/datasets',
    icon: Database,
  },
  {
    title: 'Models',
    href: '/models',
    icon: Brain,
  },
];
