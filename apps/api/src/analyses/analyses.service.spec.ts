import {
  BadGatewayException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AnalysisDomain, AnalysisStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { PythonService } from '../python/python.service';
import { AnalysesService } from './analyses.service';
import { CreateAnalysisDto } from './dto';
import type { AnalysisResult } from '@forecastme/contracts';

describe('AnalysesService', () => {
  let service: AnalysesService;

  const analysisRequest = {
    id: 'analysis-1',
    userId: 'user-1',
    conversationId: null,
    datasetId: null,
    modelVersionId: null,
    prompt: 'Will England beat Argentina?',
    status: AnalysisStatus.PENDING,
    parameters: null,
    errorCode: null,
    errorMessage: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date('2026-07-15T00:00:00.000Z'),
    updatedAt: new Date('2026-07-15T00:00:00.000Z'),
  };

  const prisma = {
    analysisRequest: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    analysisResult: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const pythonService = {
    classify: jest.fn(),
    analyze: jest.fn(),
  };

  const canonicalResult: AnalysisResult = {
    directAnswer: 'Interest rates are likely to fall.',
    probability: 0.65,
    confidence: {
      score: 0.8,
      level: 'HIGH',
      explanation: 'The supplied test indicators support the result.',
    },
    evidence: [
      {
        id: 'evidence-1',
        title: 'Inflation trend',
        description: 'Inflation has declined in this deterministic fixture.',
        impact: 'SUPPORTS',
        strength: 'HIGH',
      },
    ],
    riskFactors: [
      {
        id: 'risk-1',
        title: 'Inflation reversal',
        description: 'Renewed inflation could delay rate reductions.',
        severity: 'MEDIUM',
      },
    ],
    suggestedAction: 'Monitor the next central-bank announcement.',
    sources: [
      {
        id: 'source-1',
        title: 'Deterministic test source',
        url: 'https://example.com/test-source',
        publisher: 'ForecastMe Tests',
        retrievedAt: '2026-07-18T10:00:00.000Z',
      },
    ],
    model: {
      name: 'forecastme-test-model',
      version: '1.0.0',
      method: 'deterministic-test-fixture',
    },
    dataFreshness: {
      generatedAt: '2026-07-18T10:00:00.000Z',
      dataAsOf: '2026-07-18T09:00:00.000Z',
      status: 'CURRENT',
    },
  };

  const persistedResult = {
    id: 'result-1',
    analysisRequestId: 'analysis-1',
    summary: canonicalResult.directAnswer,
    content: canonicalResult,
    probability: 0.65,
    confidence: 0.8,
    riskScore: null,
    createdAt: new Date('2026-07-15T00:02:00.000Z'),
    updatedAt: new Date('2026-07-15T00:02:00.000Z'),
  };

  const historySelect = {
    id: true,
    prompt: true,
    domain: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    completedAt: true,
    result: {
      select: {
        probability: true,
        confidence: true,
      },
    },
  };

  const completedPythonResponse = {
    analysisId: 'analysis-1',
    status: 'completed' as const,
    result: canonicalResult,
    processingTimeMs: 25,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.$transaction.mockImplementation(
      async (operations: Promise<unknown>[]) => Promise.all(operations),
    );

    service = new AnalysesService(
      prisma as unknown as PrismaService,
      pythonService as unknown as PythonService,
    );
  });

  describe('create', () => {
    it('creates, processes, persists, and completes an analysis', async () => {
      const dto: CreateAnalysisDto = {
        prompt: 'Will interest rates fall?',
        domain: AnalysisDomain.FINANCIAL_MARKET,
      };

      const createdAnalysis = {
        ...analysisRequest,
        prompt: dto.prompt,
        domain: dto.domain,
      };

      const completedAnalysis = {
        ...analysisRequest,
        status: AnalysisStatus.COMPLETED,
        startedAt: new Date('2026-07-15T00:01:00.000Z'),
        completedAt: new Date('2026-07-15T00:02:00.000Z'),
        result: {
          id: 'result-1',
          analysisRequestId: 'analysis-1',
          summary: canonicalResult.directAnswer,
          content: canonicalResult,
          probability: 0.65,
          confidence: 0.8,
          riskScore: null,
          createdAt: new Date('2026-07-15T00:02:00.000Z'),
          updatedAt: new Date('2026-07-15T00:02:00.000Z'),
        },
      };

      prisma.analysisRequest.create.mockResolvedValue(createdAnalysis);
      prisma.analysisRequest.update.mockResolvedValue(analysisRequest);
      prisma.analysisResult.create.mockResolvedValue(completedAnalysis.result);
      prisma.analysisRequest.findUnique.mockResolvedValue(completedAnalysis);

      pythonService.analyze.mockResolvedValue(completedPythonResponse);

      prisma.$transaction.mockResolvedValue([
        completedAnalysis.result,
        completedAnalysis,
      ]);

      const result = await service.create('user-1', dto);

      expect(prisma.analysisRequest.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          prompt: dto.prompt,
          domain: dto.domain,
          conversationId: undefined,
          datasetId: undefined,
          modelVersionId: undefined,
          parameters: undefined,
        },
      });

      expect(pythonService.classify).not.toHaveBeenCalled();

      expect(pythonService.analyze).toHaveBeenCalledWith({
        analysisId: 'analysis-1',
        question: dto.prompt,
        domain: 'financial_market',
        options: undefined,
        correlationId: 'analysis-1',
      });

      expect(prisma.analysisResult.create).toHaveBeenCalledWith({
        data: {
          analysisRequestId: 'analysis-1',
          summary: canonicalResult.directAnswer,
          content: canonicalResult,
          probability: canonicalResult.probability,
          confidence: canonicalResult.confidence.score,
          riskScore: null,
        },
      });

      expect(prisma.analysisRequest.update).toHaveBeenCalledWith({
        where: {
          id: 'analysis-1',
        },
        data: {
          status: AnalysisStatus.COMPLETED,
          completedAt: expect.any(Date) as Date,
          errorCode: null,
          errorMessage: null,
        },
        include: {
          result: true,
        },
      });
      expect(result).toEqual(completedAnalysis);
    });

    it('persists FAILED when Python returns a failed response', async () => {
      const dto: CreateAnalysisDto = {
        prompt: 'Will interest rates fall?',
        domain: AnalysisDomain.FINANCIAL_MARKET,
      };

      prisma.analysisRequest.create.mockResolvedValue({
        ...analysisRequest,
        prompt: dto.prompt,
        domain: dto.domain,
      });

      prisma.analysisRequest.update.mockResolvedValue(analysisRequest);

      pythonService.analyze.mockResolvedValue({
        analysisId: 'analysis-1',
        status: 'failed',
        result: null,
        processingTimeMs: 25,
        error: {
          code: 'PYTHON_ANALYSIS_FAILED',
          message: 'Internal downstream failure details.',
        },
      });

      await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(
        BadGatewayException,
      );

      expect(prisma.analysisResult.create).not.toHaveBeenCalled();

      expect(prisma.analysisRequest.update).toHaveBeenLastCalledWith({
        where: {
          id: 'analysis-1',
        },
        data: {
          status: AnalysisStatus.FAILED,
          errorCode: 'ANALYSIS_PROCESSING_FAILED',
          errorMessage:
            'ForecastMe could not complete this analysis. Please try again.',
          completedAt: expect.any(Date) as Date,
        },
      });
    });

    it('stores a safe failure reason when the Python request throws', async () => {
      const dto: CreateAnalysisDto = {
        prompt: 'Will interest rates fall?',
        domain: AnalysisDomain.FINANCIAL_MARKET,
      };

      const internalError = new Error(
        'connect ECONNREFUSED secret-internal-host:8000',
      );

      prisma.analysisRequest.create.mockResolvedValue({
        ...analysisRequest,
        prompt: dto.prompt,
        domain: dto.domain,
      });

      prisma.analysisRequest.update.mockResolvedValue(analysisRequest);
      pythonService.analyze.mockRejectedValue(internalError);

      await expect(service.create('user-1', dto)).rejects.toBe(internalError);

      expect(prisma.analysisResult.create).not.toHaveBeenCalled();

      expect(prisma.analysisRequest.update).toHaveBeenLastCalledWith({
        where: {
          id: 'analysis-1',
        },
        data: {
          status: AnalysisStatus.FAILED,
          errorCode: 'ANALYSIS_PROCESSING_FAILED',
          errorMessage:
            'ForecastMe could not complete this analysis. Please try again.',
          completedAt: expect.any(Date) as Date,
        },
      });
    });
  });

  describe('findById', () => {
    it('returns the complete saved result to its owner', async () => {
      prisma.analysisRequest.findUnique.mockResolvedValue({
        ...analysisRequest,
        status: AnalysisStatus.COMPLETED,
        result: persistedResult,
      });

      const result = await service.findById('analysis-1', 'user-1');

      expect(prisma.analysisRequest.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'analysis-1',
        },
        include: {
          result: true,
        },
      });

      expect(result.id).toBe('analysis-1');
      expect(result.result?.analysisRequestId).toBe('analysis-1');
      expect(result.result?.content).toEqual(canonicalResult);
    });

    it('throws NotFoundException when the analysis does not exist', async () => {
      prisma.analysisRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.findById('missing-analysis', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when the analysis belongs to another user', async () => {
      prisma.analysisRequest.findUnique.mockResolvedValue({
        ...analysisRequest,
        userId: 'user-2',
        status: AnalysisStatus.COMPLETED,
        result: persistedResult,
      });

      await expect(
        service.findById('analysis-1', 'user-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('returns lightweight summaries for the authenticated user', async () => {
      prisma.analysisRequest.findMany.mockResolvedValue([
        {
          id: 'analysis-1',
          prompt: analysisRequest.prompt,
          domain: AnalysisDomain.SPORTS,
          status: AnalysisStatus.COMPLETED,
          createdAt: analysisRequest.createdAt,
          updatedAt: analysisRequest.updatedAt,
          completedAt: new Date('2026-07-15T00:02:00.000Z'),
          result: {
            probability: 0.65,
            confidence: 0.8,
          },
        },
      ]);

      prisma.analysisRequest.count.mockResolvedValue(1);

      const result = await service.findAll({
        userId: 'user-1',
        page: 1,
        limit: 20,
      });

      expect(prisma.analysisRequest.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 20,
        select: historySelect,
      });

      expect(prisma.analysisRequest.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
        },
      });

      expect(result).toEqual({
        items: [
          {
            id: 'analysis-1',
            prompt: analysisRequest.prompt,
            domain: AnalysisDomain.SPORTS,
            status: AnalysisStatus.COMPLETED,
            probability: 0.65,
            confidenceScore: 0.8,
            createdAt: analysisRequest.createdAt,
            updatedAt: analysisRequest.updatedAt,
            completedAt: new Date('2026-07-15T00:02:00.000Z'),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      expect(result.items[0]).not.toHaveProperty('result');
      expect(result.items[0]).not.toHaveProperty('content');
    });

    it('applies status, domain, and pagination filters', async () => {
      prisma.analysisRequest.findMany.mockResolvedValue([]);
      prisma.analysisRequest.count.mockResolvedValue(0);

      await service.findAll({
        userId: 'user-1',
        page: 2,
        limit: 10,
        status: AnalysisStatus.COMPLETED,
        domain: AnalysisDomain.FINANCIAL_MARKET,
      });

      expect(prisma.analysisRequest.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: AnalysisStatus.COMPLETED,
          domain: AnalysisDomain.FINANCIAL_MARKET,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 10,
        take: 10,
        select: historySelect,
      });
    });
  });

  describe('delete', () => {
    it('deletes an analysis owned by the authenticated user', async () => {
      prisma.analysisRequest.findUnique.mockResolvedValue(analysisRequest);
      prisma.analysisRequest.delete.mockResolvedValue(analysisRequest);

      const result = await service.delete('analysis-1', 'user-1');

      expect(prisma.analysisRequest.delete).toHaveBeenCalledWith({
        where: {
          id: 'analysis-1',
        },
      });

      expect(result).toEqual({
        success: true,
      });
    });

    it('throws NotFoundException when deleting a missing analysis', async () => {
      prisma.analysisRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.delete('missing-analysis', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.analysisRequest.delete).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when deleting another user analysis', async () => {
      prisma.analysisRequest.findUnique.mockResolvedValue({
        ...analysisRequest,
        userId: 'user-2',
      });

      await expect(
        service.delete('analysis-1', 'user-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(prisma.analysisRequest.delete).not.toHaveBeenCalled();
    });
  });
});
