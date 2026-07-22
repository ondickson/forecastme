/**
 * Canonical ForecastMe analysis domains.
 *
 * Provider platforms such as Polymarket, Kalshi, and sportsbooks are
 * contexts or data providers, not top-level analysis domains.
 */
export const AnalysisDomain = {
  GENERAL_RESEARCH: 'GENERAL_RESEARCH',
  CUSTOM_DATASET: 'CUSTOM_DATASET',
  SPORTS: 'SPORTS',
  FINANCIAL_MARKET: 'FINANCIAL_MARKET',
} as const;

export type AnalysisDomain = (typeof AnalysisDomain)[keyof typeof AnalysisDomain];

/**
 * Analytical task detected from the user's request.
 */
export const ClassificationTask = {
  GENERAL_RESEARCH: 'GENERAL_RESEARCH',
  DATASET_ANALYSIS: 'DATASET_ANALYSIS',
  OUTCOME_FORECAST: 'OUTCOME_FORECAST',
  DIRECTIONAL_FORECAST: 'DIRECTIONAL_FORECAST',
  COMPARISON: 'COMPARISON',
  RISK_ASSESSMENT: 'RISK_ASSESSMENT',
  UNSUPPORTED: 'UNSUPPORTED',
} as const;

export type ClassificationTask = (typeof ClassificationTask)[keyof typeof ClassificationTask];

/**
 * Classifier that produced the classification metadata.
 */
export const ClassifierSource = {
  LLM: 'LLM',
  RULE_BASED_FALLBACK: 'RULE_BASED_FALLBACK',
} as const;

export type ClassifierSource = (typeof ClassifierSource)[keyof typeof ClassifierSource];

/**
 * Canonical lifecycle state of an analysis.
 */
export const AnalysisStatus = {
  PENDING: 'PENDING',
  CLASSIFYING: 'CLASSIFYING',
  COLLECTING_DATA: 'COLLECTING_DATA',
  ANALYZING: 'ANALYZING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type AnalysisStatus = (typeof AnalysisStatus)[keyof typeof AnalysisStatus];

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
 * Metadata produced when the Python service classifies an analysis request.
 *
 * Unsupported requests still use one of the four canonical domains and are
 * identified through isSupported instead of introducing another domain.
 */
export interface ClassificationMetadata {
  domain: AnalysisDomain;
  task: ClassificationTask;
  confidence: number;
  reasoning: string;
  isSupported: boolean;
  entities: string[];
  dates: string[];
  timeHorizon: string | null;
  requiresLiveData: boolean;
  classifier: ClassifierSource;
  predictionIntent: boolean;
  comparisonIntent: boolean;
  riskIntent: boolean;
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
