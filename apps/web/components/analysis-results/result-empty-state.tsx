import { FileQuestion } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ResultEmptyStateProps {
  title?: string;
  description?: string;
}

export function ResultEmptyState({
  title = 'No analysis result yet',
  description = 'Submit a question to generate and display a structured ForecastMe result.',
}: ResultEmptyStateProps) {
  return (
    <Card>
      <CardHeader className="items-center gap-3 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <FileQuestion aria-hidden="true" className="size-5 text-muted-foreground" />
        </div>
        <CardTitle as="h3" className="text-base">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-center text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
