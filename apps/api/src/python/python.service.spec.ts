import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { throwError } from 'rxjs';
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

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    service = new PythonService(httpService as unknown as HttpService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
