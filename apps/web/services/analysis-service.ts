import { authenticatedApiRequest } from '@/lib/api/authenticated-client';
import type { AnalysisRequestRecord, CreateAnalysisRequest } from '@/types/analysis';

const ANALYSES_PATH = '/analyses';

export function createAnalysis(request: CreateAnalysisRequest): Promise<AnalysisRequestRecord> {
  return authenticatedApiRequest<AnalysisRequestRecord>(ANALYSES_PATH, {
    method: 'POST',
    body: request,
  });
}
