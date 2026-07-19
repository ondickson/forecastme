import { CircleAlert, Lightbulb } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SuggestedActionSectionProps {
  suggestedAction: string | null;
  showFinancialRiskNotice?: boolean;
}

export function SuggestedActionSection({
  suggestedAction,
  showFinancialRiskNotice = false,
}: SuggestedActionSectionProps) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="gap-2">
        <CardTitle as="h3" className="flex items-center gap-2 text-base">
          <Lightbulb aria-hidden="true" className="size-4 text-primary" />
          Suggested action
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
          {suggestedAction?.trim() ||
            'No responsible action can be recommended from the available information.'}
        </p>

        <p className="text-xs leading-5 text-muted-foreground">
          This is analytical guidance, not a guaranteed course of action.
        </p>

        {showFinancialRiskNotice && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-background/70 p-3">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />

            <p className="text-xs leading-5 text-muted-foreground">
              This is not financial advice. Financial markets and betting can result in substantial
              losses. Verify the information and consider qualified professional advice before
              risking money.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
