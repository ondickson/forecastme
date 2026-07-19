import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { of, throwError } from 'rxjs';
import { PythonAnalysisRequest, PythonService } from './python.service';

describe('PythonService', () => {
  let service: PythonService;

  const httpService = {
    post: jest.fn(),
  };

  const request: PythonAnalysisRequest = {
    analysisId: 'analysis-1',
    question: 'Will interest rates fall?',
    domain: 'financial_market',
    correlationId: 'analysis-1',
  };

  const completedResponse = {
    analysisId: 'analysis-1',
    status: 'completed',
    result: {
      directAnswer:
        'No predictive probability is available because no model was executed.',
      probability: null,
      confidence: {
        score: null,
        level: null,
        explanation:
          'Confidence cannot be scored because no probability was calculated.',
      },
      evidence: [],
      riskFactors: [],
      suggestedAction: null,
      sources: [],
      model: {
        name: 'forecastme-contract-validator',
        version: '0.1.0',
        method: 'schema-validation-only',
      },
      dataFreshness: {
        generatedAt: '2026-07-18T10:00:00.000Z',
        dataAsOf: null,
        status: 'UNKNOWN',
      },
    },
    processingTimeMs: null,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    service = new PythonService(httpService as unknown as HttpService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('validates and returns a completed canonical response', async () => {
    httpService.post.mockReturnValue(
      of({
        data: completedResponse,
      }),
    );

    await expect(service.analyze(request)).resolves.toEqual(completedResponse);
  });

  it('accepts explicit nulls and empty result collections', async () => {
    httpService.post.mockReturnValue(
      of({
        data: completedResponse,
      }),
    );

    const response = await service.analyze(request);

    expect(response.result?.probability).toBeNull();
    expect(response.result?.confidence.score).toBeNull();
    expect(response.result?.evidence).toEqual([]);
    expect(response.result?.riskFactors).toEqual([]);
    expect(response.result?.sources).toEqual([]);
    expect(response.result?.suggestedAction).toBeNull();
  });

  it('accepts a valid failed response from the analysis service', async () => {
    const failedResponse = {
      analysisId: 'analysis-1',
      status: 'failed',
      result: null,
      processingTimeMs: 15,
      error: {
        code: 'ANALYSIS_FAILED',
        message: 'The analysis could not be completed.',
      },
    };

    httpService.post.mockReturnValue(
      of({
        data: failedResponse,
      }),
    );

    await expect(service.analyze(request)).resolves.toEqual(failedResponse);
  });

  it('rejects an out-of-range probability as BadGatewayException', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          ...completedResponse,
          result: {
            ...completedResponse.result,
            probability: 1.1,
          },
        },
      }),
    );

    await expect(service.analyze(request)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('rejects inconsistent confidence as BadGatewayException', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          ...completedResponse,
          result: {
            ...completedResponse.result,
            confidence: {
              score: 0.8,
              level: null,
              explanation: 'Invalid confidence combination.',
            },
          },
        },
      }),
    );

    await expect(service.analyze(request)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('rejects a response for a different analysis ID', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          ...completedResponse,
          analysisId: 'analysis-2',
        },
      }),
    );

    await expect(service.analyze(request)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('rejects unexpected response fields', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          ...completedResponse,
          internalDebugInformation: 'must not be accepted',
        },
      }),
    );

    await expect(service.analyze(request)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('maps a downstream HTTP failure to BadGatewayException', async () => {
    const error = new AxiosError(
      'Request failed with status code 422',
      'ERR_BAD_RESPONSE',
    );

    Object.assign(error, {
      response: {
        status: 422,
        data: {
          code: 'VALIDATION_ERROR',
        },
      },
    });

    httpService.post.mockReturnValue(throwError(() => error));

    await expect(service.analyze(request)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('maps a connection failure to ServiceUnavailableException', async () => {
    const error = new AxiosError('connect ECONNREFUSED', 'ECONNREFUSED');

    httpService.post.mockReturnValue(throwError(() => error));

    await expect(service.analyze(request)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
