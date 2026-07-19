import type { DataFreshness, FreshnessStatus } from '@/types/analysis';

export const UNAVAILABLE_RESULT_VALUE = 'Not available';

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
});

const freshnessLabels: Record<FreshnessStatus, string> = {
  CURRENT: 'Current',
  AGING: 'Aging',
  STALE: 'Stale',
  UNKNOWN: 'Unknown',
};

export function formatPercentage(
  value: number | null | undefined,
  maximumFractionDigits = 0,
): string {
  if (value === null || value === undefined || !Number.isFinite(value) || value < 0 || value > 1) {
    return UNAVAILABLE_RESULT_VALUE;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return UNAVAILABLE_RESULT_VALUE;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return UNAVAILABLE_RESULT_VALUE;
  }

  return dateTimeFormatter.format(date);
}

export function formatFreshnessStatus(status: FreshnessStatus | null | undefined): string {
  return status ? freshnessLabels[status] : freshnessLabels.UNKNOWN;
}

export function formatFreshnessReference(freshness: DataFreshness): string {
  if (freshness.dataAsOf) {
    const formattedDataDate = formatDateTime(freshness.dataAsOf);

    if (formattedDataDate !== UNAVAILABLE_RESULT_VALUE) {
      return `Data as of ${formattedDataDate}`;
    }
  }

  if (freshness.status === 'UNKNOWN') {
    return 'No external data timestamp available';
  }

  const formattedGenerationDate = formatDateTime(freshness.generatedAt);

  if (formattedGenerationDate === UNAVAILABLE_RESULT_VALUE) {
    return UNAVAILABLE_RESULT_VALUE;
  }

  return `Generated ${formattedGenerationDate}`;
}
