/**
 * Supported ForecastMe analysis domains.
 *
 * CUSTOM is used when a request does not fit an existing specialized domain.
 */
export enum AnalysisDomain {
  SPORTS = 'sports',
  BETTING = 'betting',
  STOCKS = 'stocks',
  CRYPTO = 'crypto',
  ECONOMICS = 'economics',
  WEATHER = 'weather',
  RISK = 'risk',
  DATASET = 'dataset',
  CUSTOM = 'custom',
}

/**
 * Lifecycle state of an analysis.
 */
export enum AnalysisStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * User-configurable analysis parameters.
 */
export interface AnalysisOptions {
  includeExplanation?: boolean;
  includeSources?: boolean;
  includeConfidence?: boolean;
  timeHorizon?: string;
  riskPreference?: 'low' | 'medium' | 'high';
}

/**
 * Public request sent by the frontend to the NestJS Core API.
 */
export interface CreateAnalysisRequest {
  question: string;
  domain: AnalysisDomain;
  options?: AnalysisOptions;
  datasetId?: string;
}

/**
 * Internal request sent by the NestJS Core API to the Python Analysis Service.
 *
 * User-sensitive data should not be added unless analytically necessary.
 */
export interface AnalysisServiceRequest {
  analysisId: string;
  question: string;
  domain: AnalysisDomain;
  options?: AnalysisOptions;
  datasetObjectKey?: string;
  correlationId: string;
}

/**
 * Supported confidence levels.
 */
export const confidenceLevels = ['LOW', 'MEDIUM', 'HIGH'] as const;

export type ConfidenceLevel = (typeof confidenceLevels)[number];

/**
 * How an evidence item affects the predicted outcome.
 */
export const evidenceImpacts = ['SUPPORTS', 'OPPOSES', 'NEUTRAL'] as const;

export type EvidenceImpact = (typeof evidenceImpacts)[number];

/**
 * Supported evidence-strength and risk-severity levels.
 */
export const strengthLevels = ['LOW', 'MEDIUM', 'HIGH'] as const;

export type StrengthLevel = (typeof strengthLevels)[number];

/**
 * Supported data-freshness states.
 */
export const freshnessStatuses = ['CURRENT', 'AGING', 'STALE', 'UNKNOWN'] as const;

export type FreshnessStatus = (typeof freshnessStatuses)[number];

/**
 * Confidence describes how reliable ForecastMe considers an estimate.
 *
 * It is separate from probability, which describes the estimated likelihood
 * of an outcome.
 */
export interface AnalysisConfidence {
  score: number | null;
  level: ConfidenceLevel | null;
  explanation: string | null;
}

/**
 * Verified information used to support or oppose the result.
 */
export interface EvidenceItem {
  id: string;
  title: string;
  description: string;
  impact: EvidenceImpact | null;
  strength: StrengthLevel | null;
}

/**
 * A condition that could negatively affect the result.
 */
export interface RiskFactor {
  id: string;
  title: string;
  description: string;
  severity: StrengthLevel | null;
}

/**
 * A verified source used during the analysis.
 */
export interface AnalysisSource {
  id: string;
  title: string;
  url: string | null;
  publisher: string | null;
  retrievedAt: string | null;
}

/**
 * Exact model or analytical method used to produce the result.
 */
export interface ModelInformation {
  name: string;
  version: string;
  method: string | null;
}

/**
 * Timestamp and freshness information for the result.
 *
 * Timestamps must be UTC ISO 8601 strings.
 */
export interface DataFreshness {
  generatedAt: string;
  dataAsOf: string | null;
  status: FreshnessStatus;
}

/**
 * Canonical ForecastMe result shared by Python, NestJS, persistence,
 * and the frontend.
 *
 * Probability uses a zero-to-one scale and must be null when it cannot
 * be calculated. The frontend is responsible for percentage formatting.
 */
export interface AnalysisResult {
  directAnswer: string;
  probability: number | null;
  confidence: AnalysisConfidence;
  evidence: EvidenceItem[];
  riskFactors: RiskFactor[];
  suggestedAction: string | null;
  sources: AnalysisSource[];
  model: ModelInformation;
  dataFreshness: DataFreshness;
}

/**
 * Structured response returned by the Python Analysis Service.
 */
export interface AnalysisServiceResponse {
  analysisId: string;
  status: AnalysisStatus;
  result: AnalysisResult | null;
  processingTimeMs: number | null;
  error: {
    code: string;
    message: string;
  } | null;
}

/**
 * Public analysis object returned by the NestJS API.
 */
export interface AnalysisResponse {
  id: string;
  question: string;
  domain: AnalysisDomain;
  status: AnalysisStatus;
  result: AnalysisResult | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

/**
 * Lightweight analysis entry used in history lists.
 */
export interface AnalysisHistoryItem {
  id: string;
  question: string;
  domain: AnalysisDomain;
  status: AnalysisStatus;
  probability: number | null;
  confidenceLevel: ConfidenceLevel | null;
  createdAt: string;
  completedAt: string | null;
}
