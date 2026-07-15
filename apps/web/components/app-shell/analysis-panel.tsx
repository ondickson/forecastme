import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function AnalysisPanel() {
  return (
    <aside className="flex h-full flex-col bg-card">
      <div className="flex h-14 items-center justify-between px-4">
        <h2 className="font-medium">Analysis</h2>

        <Badge variant="secondary">Idle</Badge>
      </div>

      <Separator />

      <div className="flex-1 p-4">
        <div className="rounded-lg border border-dashed p-4">
          <p className="text-sm font-medium">No analysis selected</p>

          <p className="mt-2 text-sm text-muted-foreground">
            Results, probability estimates, confidence scores, supporting evidence, and metadata
            will appear here.
          </p>
        </div>
      </div>
    </aside>
  );
}
