import { ExternalLink, Library } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime, UNAVAILABLE_RESULT_VALUE } from '@/lib/analysis/result-formatters';
import type { AnalysisSource } from '@/types/analysis';

interface SourcesSectionProps {
  sources: AnalysisSource[];
}

function getSafeExternalUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export function SourcesSection({ sources }: SourcesSectionProps) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle as="h3" className="flex items-center gap-2 text-base">
          <Library aria-hidden="true" className="size-4 text-primary" />
          Sources
        </CardTitle>
      </CardHeader>

      <CardContent>
        {sources.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">
            No external sources were used for this analysis.
          </p>
        ) : (
          <ul className="space-y-3">
            {sources.map((source) => {
              const safeUrl = getSafeExternalUrl(source.url);
              const retrievedAt = formatDateTime(source.retrievedAt);
              const hasRetrievalTime = retrievedAt !== UNAVAILABLE_RESULT_VALUE;

              return (
                <li key={source.id} className="min-w-0 space-y-1 rounded-lg border bg-muted/20 p-3">
                  {safeUrl ? (
                    <a
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      <span>{source.title}</span>
                      <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
                      <span className="sr-only">Opens in a new tab</span>
                    </a>
                  ) : (
                    <p className="break-words text-sm font-medium text-foreground">
                      {source.title}
                    </p>
                  )}

                  {source.publisher && (
                    <p className="break-words text-xs text-muted-foreground">
                      Publisher: {source.publisher}
                    </p>
                  )}

                  {hasRetrievalTime && (
                    <p className="text-xs text-muted-foreground">Retrieved {retrievedAt}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
