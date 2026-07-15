import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AnalysisDomain } from '../generated/prisma/enums';

export interface ClassifyRequest {
  prompt: string;
}

export interface ClassifyResponse {
  domain: AnalysisDomain;
  confidence: number;
  reasoning: string;
}

export interface PythonAnalysisOptions {
  includeExplanation?: boolean;
  includeSources?: boolean;
  includeConfidence?: boolean;
  timeHorizon?: string;
  riskTolerance?: string;
}

export interface PythonAnalysisRequest {
  analysisId: string;
  question: string;
  domain: 'general_research' | 'custom_dataset' | 'sports' | 'financial_market';
  options?: PythonAnalysisOptions;
  correlationId?: string;
}

export interface PredictionResult {
  outcome: string;
  probability: number | null;
  confidence: number | null;
  recommendation: string | null;
}

export interface PythonAnalysisResponse {
  analysisId: string;
  status: string;
  result: PredictionResult;
  summary: string;
  assumptions: string[];
  limitations: string[];
  sources: unknown[];
  processingTimeMs: number;
}

@Injectable()
export class PythonService {
  private readonly logger = new Logger(PythonService.name);

  constructor(private readonly httpService: HttpService) {}

  async classify(
    request: ClassifyRequest,
    requestId?: string,
  ): Promise<ClassifyResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<ClassifyResponse>('/classify', request, {
          headers: this.createRequestHeaders(requestId),
        }),
      );

      return response.data;
    } catch (error: unknown) {
      this.handlePythonServiceError(error, 'classification', requestId);
    }
  }

  async analyze(
    request: PythonAnalysisRequest,
    requestId?: string,
  ): Promise<PythonAnalysisResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<PythonAnalysisResponse>(
          '/internal/v1/analyses',
          request,
          {
            headers: this.createRequestHeaders(requestId),
          },
        ),
      );

      return response.data;
    } catch (error: unknown) {
      this.handlePythonServiceError(error, 'analysis', requestId);
    }
  }

  private createRequestHeaders(
    requestId?: string,
  ): Record<string, string> | undefined {
    if (!requestId) {
      return undefined;
    }

    return {
      'X-Request-ID': requestId,
    };
  }

  private handlePythonServiceError(
    error: unknown,
    operation: string,
    requestId?: string,
  ): never {
    if (error instanceof AxiosError) {
      const responseData: unknown = error.response?.data;

      this.logger.error({
        message: `Python service ${operation} request failed`,
        requestId,
        statusCode: error.response?.status,
        response: responseData,
        error: error.message,
      });
    } else {
      this.logger.error({
        message: `Unexpected Python service ${operation} error`,
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    throw new ServiceUnavailableException(
      'The analysis service is currently unavailable',
    );
  }
}
