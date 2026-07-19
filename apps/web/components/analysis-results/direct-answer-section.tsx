import { MessageSquareText } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DirectAnswerSectionProps {
  directAnswer: string;
}

export function DirectAnswerSection({ directAnswer }: DirectAnswerSectionProps) {
  const answer = directAnswer.trim();

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle as="h3" className="flex items-center gap-2 text-base">
          <MessageSquareText aria-hidden="true" className="size-4 text-primary" />
          Direct answer
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
          {answer || 'No direct answer is available for this analysis.'}
        </p>

        <p className="text-xs leading-5 text-muted-foreground">
          This is an analytical assessment, not a guaranteed outcome.
        </p>
      </CardContent>
    </Card>
  );
}
