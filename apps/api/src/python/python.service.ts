import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadGatewayException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AnalysisDomain } from '../generated/prisma/enums';
import {
  InvalidPythonAnalysisResponseError,
  type PythonAnalysisResponse,
  validatePythonAnalysisResponse,
} from './dto/analysis-response.dto';

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
  riskPreference?: string;
}

export interface PythonAnalysisRequest {
  analysisId: string;
  question: string;
  domain: 'general_research' | 'custom_dataset' | 'sports' | 'financial_market';
  options?: PythonAnalysisOptions;
  correlationId?: string;
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
        this.httpService.post<unknown>('/internal/v1/analyses', request, {
          headers: this.createRequestHeaders(requestId),
        }),
      );

      return validatePythonAnalysisResponse(response.data, request.analysisId);
    } catch (error: unknown) {
      if (error instanceof InvalidPythonAnalysisResponseError) {
        this.logger.error({
          message: 'Python service returned an invalid analysis response',
          requestId,
          analysisId: request.analysisId,
        });

        throw new BadGatewayException(
          'The analysis service returned an invalid response',
        );
      }

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
      const status = error.response?.status;
      const responseData: unknown = error.response?.data;

      this.logger.error({
        message: `Python service ${operation} request failed`,
        requestId,
        statusCode: status,
        response: responseData,
        error: error.message,
      });

      if (status !== undefined) {
        throw new BadGatewayException(
          'The analysis service failed to process the internal request',
        );
      }
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
