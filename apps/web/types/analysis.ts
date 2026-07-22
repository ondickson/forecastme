import type { AnalysisResult, ClassificationMetadata } from '@forecastme/contracts';

export type {
  AnalysisConfidence,
  AnalysisResult,
  AnalysisSource,
  ClassificationMetadata,
  ConfidenceLevel,
  DataFreshness,
  EvidenceImpact,
  EvidenceItem,
  FreshnessStatus,
  ModelInformation,
  RiskFactor,
  StrengthLevel,
} from '@forecastme/contracts';

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

export const RISK_PREFERENCES = ['low', 'medium', 'high'] as const;

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
  allowDuplicate?: boolean;
}

export interface AnalysisResultRecord {
  id: string;
  analysisRequestId: string;
  summary: string | null;
  content: AnalysisResult;
  probability: number | null;
  confidence: number | null;
  riskScore: number | null;
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
  parameters: AnalysisParameters | null;
  classificationMetadata: ClassificationMetadata | null;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  result: AnalysisResultRecord | null;
}

export interface CreateAnalysisResponse {
  analysis: AnalysisRequestRecord;
  duplicate: boolean;
}

export interface AnalysisHistoryItem {
  id: string;
  prompt: string;
  domain: AnalysisDomain;
  status: AnalysisStatus;
  probability: number | null;
  confidenceScore: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface PaginatedAnalysesResponse {
  items: AnalysisHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListAnalysesOptions {
  page?: number;
  limit?: number;
  status?: AnalysisStatus;
  domain?: AnalysisDomain;
}

export type AnalysisSubmissionStatus = 'idle' | 'submitting' | 'succeeded' | 'failed';
