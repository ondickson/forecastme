import { z } from 'zod';

import { ANALYSIS_DOMAINS, RISK_PREFERENCES, TIME_HORIZONS } from '@/types/analysis';

export const MIN_QUESTION_LENGTH = 3;
export const MAX_QUESTION_LENGTH = 5_000;
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export const SUPPORTED_ATTACHMENT_EXTENSIONS = ['csv', 'xlsx', 'xls', 'json'] as const;

const SUPPORTED_MIME_TYPES: Record<string, readonly string[]> = {
  csv: ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'],
  xlsx: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
  ],
  xls: ['application/vnd.ms-excel', 'application/octet-stream'],
  json: ['application/json', 'text/json', 'text/plain'],
};

function isFile(value: unknown): value is File {
  return typeof File !== 'undefined' && value instanceof File;
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

const attachmentSchema = z
  .custom<File | null>((value) => value === null || isFile(value), {
    message: 'Select a valid file.',
  })
  .superRefine((file, context) => {
    if (file === null || !isFile(file)) {
      return;
    }

    const extension = getFileExtension(file.name);

    if (
      !SUPPORTED_ATTACHMENT_EXTENSIONS.includes(
        extension as (typeof SUPPORTED_ATTACHMENT_EXTENSIONS)[number],
      )
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Choose a CSV, Excel, or JSON file.',
      });
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      context.addIssue({
        code: 'custom',
        message: 'The selected file must be 10 MB or smaller.',
      });
    }

    const normalizedMimeType = file.type.toLowerCase();

    if (normalizedMimeType && !SUPPORTED_MIME_TYPES[extension]?.includes(normalizedMimeType)) {
      context.addIssue({
        code: 'custom',
        message: 'The selected file type does not match its extension.',
      });
    }
  });

export const analysisFormSchema = z.object({
  question: z
    .string()
    .trim()
    .min(MIN_QUESTION_LENGTH, 'Enter at least 3 characters.')
    .max(MAX_QUESTION_LENGTH, 'Your question must not exceed 5,000 characters.'),
  domain: z.enum(ANALYSIS_DOMAINS),
  timeHorizon: z.enum(TIME_HORIZONS),
  riskPreference: z.enum(RISK_PREFERENCES),
  attachment: attachmentSchema,
});
