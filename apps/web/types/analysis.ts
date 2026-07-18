export const ANALYSIS_DOMAINS = [
  'GENERAL_RESEARCH',
  'CUSTOM_DATASET',
  'SPORTS',
  'FINANCIAL_MARKET',
] as const;

export type AnalysisDomain = (typeof ANALYSIS_DOMAINS)[number];

export const ANALYSIS_STATUSES = [
  'PENDING',
  'CLASSIFYING',
  'COLLECTING_DATA',
  'ANALYZING',
  'COMPLETED',
  'FAILED',
] as const;

export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];

export const TIME_HORIZONS = [
  'IMMEDIATE',
  'NEXT_24_HOURS',
  'NEXT_7_DAYS',
  'NEXT_30_DAYS',
  'NEXT_3_MONTHS',
  'NEXT_12_MONTHS',
  'LONG_TERM',
] as const;

export type TimeHorizon = (typeof TIME_HORIZONS)[number];

export const RISK_PREFERENCES = ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] as const;

export type RiskPreference = (typeof RISK_PREFERENCES)[number];

export interface AttachmentMetadata {
  name: string;
  size: number;
  type: string;
  extension: string;
}

export interface AnalysisFormValues {
  question: string;
  domain: AnalysisDomain;
  timeHorizon: TimeHorizon;
  riskPreference: RiskPreference;
  attachment: File | null;
}

export interface AnalysisParameters {
  timeHorizon: TimeHorizon;
  riskPreference: RiskPreference;
  attachment?: AttachmentMetadata;
}

export interface CreateAnalysisRequest {
  prompt: string;
  domain: AnalysisDomain;
  parameters: AnalysisParameters;
}

export interface AnalysisResultRecord {
  id: string;
  analysisRequestId: string;
  summary: string | null;
  probability: number | null;
  confidence: number | null;
  evidence: unknown;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisRequestRecord {
  id: string;
  userId: string;
  conversationId: string | null;
  datasetId: string | null;
  modelVersionId: string | null;
  prompt: string;
  domain: AnalysisDomain;
  status: AnalysisStatus;
  parameters: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  result?: AnalysisResultRecord | null;
}

export type AnalysisSubmissionStatus = 'idle' | 'submitting' | 'succeeded' | 'failed';
