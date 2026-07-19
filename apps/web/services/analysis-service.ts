import {
  analysisRequestRecordSchema,
  paginatedAnalysesResponseSchema,
} from '@/lib/analysis/analysis-response-schema';
import { authenticatedApiRequest } from '@/lib/api/authenticated-client';
import { ApiError } from '@/lib/api/errors';
import type {
  AnalysisRequestRecord,
  CreateAnalysisRequest,
  ListAnalysesOptions,
  PaginatedAnalysesResponse,
} from '@/types/analysis';

const ANALYSES_PATH = '/analyses';

function invalidResponseError(): ApiError {
  return new ApiError(
    'ForecastMe received an invalid analysis response. No result will be displayed.',
    {
      status: 502,
      code: 'INVALID_API_RESPONSE',
    },
  );
}

function parseAnalysisResponse(response: unknown): AnalysisRequestRecord {
  const parsedResponse = analysisRequestRecordSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw invalidResponseError();
  }

  return parsedResponse.data;
}

function parseHistoryResponse(response: unknown): PaginatedAnalysesResponse {
  const parsedResponse = paginatedAnalysesResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw invalidResponseError();
  }

  return parsedResponse.data;
}

export async function createAnalysis(
  request: CreateAnalysisRequest,
): Promise<AnalysisRequestRecord> {
  const response = await authenticatedApiRequest<unknown>(ANALYSES_PATH, {
    method: 'POST',
    body: request,
  });

  return parseAnalysisResponse(response);
}

export async function getAnalysis(id: string): Promise<AnalysisRequestRecord> {
  const response = await authenticatedApiRequest<unknown>(
    `${ANALYSES_PATH}/${encodeURIComponent(id)}`,
  );

  const analysis = parseAnalysisResponse(response);

  if (analysis.id !== id) {
    throw invalidResponseError();
  }

  return analysis;
}

export async function listAnalyses(
  options: ListAnalysesOptions = {},
): Promise<PaginatedAnalysesResponse> {
  const searchParameters = new URLSearchParams();

  if (options.page !== undefined) {
    searchParameters.set('page', String(options.page));
  }

  if (options.limit !== undefined) {
    searchParameters.set('limit', String(options.limit));
  }

  if (options.status !== undefined) {
    searchParameters.set('status', options.status);
  }

  if (options.domain !== undefined) {
    searchParameters.set('domain', options.domain);
  }

  const query = searchParameters.toString();
  const path = query ? `${ANALYSES_PATH}?${query}` : ANALYSES_PATH;

  const response = await authenticatedApiRequest<unknown>(path);

  return parseHistoryResponse(response);
}
