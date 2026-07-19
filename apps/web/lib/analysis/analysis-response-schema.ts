import {
  confidenceLevels,
  evidenceImpacts,
  freshnessStatuses,
  strengthLevels,
} from '@forecastme/contracts';
import { z } from 'zod';

import {
  ANALYSIS_DOMAINS,
  ANALYSIS_STATUSES,
  RISK_PREFERENCES,
  TIME_HORIZONS,
} from '@/types/analysis';

const requiredStringSchema = z.string().trim().min(1);

const utcDateTimeSchema = z.iso.datetime({ offset: true }).refine((value) => value.endsWith('Z'), {
  message: 'Timestamp must use UTC.',
});

const nullableDateTimeSchema = utcDateTimeSchema.nullable();

const unitIntervalSchema = z.number().finite().min(0).max(1).nullable();

const databaseUnitIntervalSchema = z
  .union([
    z.number().finite(),
    z
      .string()
      .trim()
      .regex(/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/)
      .transform(Number),
  ])
  .pipe(z.number().finite().min(0).max(1))
  .nullable();

const confidenceSchema = z
  .object({
    score: unitIntervalSchema,
    level: z.enum(confidenceLevels).nullable(),
    explanation: z.string().nullable(),
  })
  .strict()
  .superRefine((confidence, context) => {
    const hasScore = confidence.score !== null;
    const hasLevel = confidence.level !== null;

    if (hasScore !== hasLevel) {
      context.addIssue({
        code: 'custom',
        message: 'Confidence score and level must both be present or both be null.',
      });
    }
  });

const evidenceItemSchema = z
  .object({
    id: requiredStringSchema,
    title: requiredStringSchema,
    description: requiredStringSchema,
    impact: z.enum(evidenceImpacts).nullable(),
    strength: z.enum(strengthLevels).nullable(),
  })
  .strict();

const riskFactorSchema = z
  .object({
    id: requiredStringSchema,
    title: requiredStringSchema,
    description: requiredStringSchema,
    severity: z.enum(strengthLevels).nullable(),
  })
  .strict();

const sourceSchema = z
  .object({
    id: requiredStringSchema,
    title: requiredStringSchema,
    url: z.url().nullable(),
    publisher: z.string().nullable(),
    retrievedAt: nullableDateTimeSchema,
  })
  .strict();

const modelSchema = z
  .object({
    name: requiredStringSchema,
    version: requiredStringSchema,
    method: z.string().nullable(),
  })
  .strict();

const dataFreshnessSchema = z
  .object({
    generatedAt: utcDateTimeSchema,
    dataAsOf: nullableDateTimeSchema,
    status: z.enum(freshnessStatuses),
  })
  .strict();

export const analysisResultSchema = z
  .object({
    directAnswer: requiredStringSchema,
    probability: unitIntervalSchema,
    confidence: confidenceSchema,
    evidence: z.array(evidenceItemSchema),
    riskFactors: z.array(riskFactorSchema),
    suggestedAction: z.string().nullable(),
    sources: z.array(sourceSchema),
    model: modelSchema,
    dataFreshness: dataFreshnessSchema,
  })
  .strict();

const attachmentSchema = z
  .object({
    name: requiredStringSchema,
    size: z.number().int().nonnegative(),
    type: z.string(),
    extension: z.string(),
  })
  .strict();

const parametersSchema = z
  .object({
    timeHorizon: z.enum(TIME_HORIZONS),
    riskPreference: z.enum(RISK_PREFERENCES),
    attachment: attachmentSchema.optional(),
  })
  .strict();

export const analysisResultRecordSchema = z
  .object({
    id: requiredStringSchema,
    analysisRequestId: requiredStringSchema,
    summary: z.string().nullable(),
    content: analysisResultSchema,
    probability: databaseUnitIntervalSchema,
    confidence: databaseUnitIntervalSchema,
    riskScore: databaseUnitIntervalSchema,
    createdAt: utcDateTimeSchema,
    updatedAt: utcDateTimeSchema,
  })
  .strict();

export const analysisRequestRecordSchema = z
  .object({
    id: requiredStringSchema,
    userId: requiredStringSchema,
    conversationId: z.string().nullable(),
    datasetId: z.string().nullable(),
    modelVersionId: z.string().nullable(),
    prompt: requiredStringSchema,
    domain: z.enum(ANALYSIS_DOMAINS),
    status: z.enum(ANALYSIS_STATUSES),
    parameters: parametersSchema.nullable(),
    errorCode: z.string().nullable(),
    errorMessage: z.string().nullable(),
    startedAt: nullableDateTimeSchema,
    createdAt: utcDateTimeSchema,
    updatedAt: utcDateTimeSchema,
    completedAt: nullableDateTimeSchema,
    result: analysisResultRecordSchema.nullable(),
  })
  .strict()
  .superRefine((analysis, context) => {
    if (analysis.status === 'COMPLETED' && analysis.result === null) {
      context.addIssue({
        code: 'custom',
        path: ['result'],
        message: 'A completed analysis must include a result.',
      });
    }

    if (analysis.status === 'FAILED' && analysis.result !== null) {
      context.addIssue({
        code: 'custom',
        path: ['result'],
        message: 'A failed analysis cannot include a result.',
      });
    }
    if (analysis.result !== null && analysis.result.analysisRequestId !== analysis.id) {
      context.addIssue({
        code: 'custom',
        path: ['result', 'analysisRequestId'],
        message: 'The saved result belongs to a different analysis request.',
      });
    }
  });

export const analysisHistoryItemSchema = z
  .object({
    id: requiredStringSchema,
    prompt: requiredStringSchema,
    domain: z.enum(ANALYSIS_DOMAINS),
    status: z.enum(ANALYSIS_STATUSES),
    probability: databaseUnitIntervalSchema,
    confidenceScore: databaseUnitIntervalSchema,
    createdAt: utcDateTimeSchema,
    updatedAt: utcDateTimeSchema,
    completedAt: nullableDateTimeSchema,
  })
  .strict();

export const paginatedAnalysesResponseSchema = z
  .object({
    items: z.array(analysisHistoryItemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();
