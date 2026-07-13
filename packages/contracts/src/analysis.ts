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
  riskTolerance?: 'low' | 'medium' | 'high';
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
 * A source used during an analysis.
 */
export interface AnalysisSource {
  name: string;
  type: 'api' | 'dataset' | 'document' | 'model' | 'manual';
  reference?: string;
  retrievedAt?: string;
}

/**
 * Model metadata associated with an analytical result.
 */
export interface ModelMetadata {
  name: string;
  version: string;
  trainedAt?: string;
}

/**
 * Core probability output.
 *
 * Probability and confidence values must be represented between 0 and 1.
 */
export interface PredictionResult {
  outcome: string;
  probability: number;
  confidence?: number;
  expectedValue?: number;
  recommendation?: string;
}

/**
 * Structured response returned by the Python Analysis Service.
 */
export interface AnalysisServiceResponse {
  analysisId: string;
  status: AnalysisStatus;
  result?: PredictionResult;
  summary?: string;
  assumptions: string[];
  limitations: string[];
  sources: AnalysisSource[];
  model?: ModelMetadata;
  processingTimeMs?: number;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Public analysis object returned by the NestJS API.
 */
export interface AnalysisResponse {
  id: string;
  question: string;
  domain: AnalysisDomain;
  status: AnalysisStatus;
  result?: PredictionResult;
  summary?: string;
  assumptions: string[];
  limitations: string[];
  sources: AnalysisSource[];
  model?: ModelMetadata;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Lightweight analysis entry used in history lists.
 */
export interface AnalysisHistoryItem {
  id: string;
  question: string;
  domain: AnalysisDomain;
  status: AnalysisStatus;
  probability?: number;
  createdAt: string;
  completedAt?: string;
}
