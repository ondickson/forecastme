import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AnalysisDomain, AnalysisStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysesService } from './analyses.service';
import { CreateAnalysisDto } from './dto';

describe('AnalysesService', () => {
  let service: AnalysesService;

  const analysisRequest = {
    id: 'analysis-1',
    userId: 'user-1',
    conversationId: null,
    datasetId: null,
    modelVersionId: null,
    prompt: 'Will England beat Argentina?',
    domain: AnalysisDomain.SPORTS,
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
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.$transaction.mockImplementation(
      async (operations: Promise<unknown>[]) => Promise.all(operations),
    );

    service = new AnalysesService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates an analysis belonging to the authenticated user', async () => {
      const dto: CreateAnalysisDto = {
        prompt: 'Will England beat Argentina?',
        domain: AnalysisDomain.SPORTS,
      };

      prisma.analysisRequest.create.mockResolvedValue(analysisRequest);

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

      expect(result).toEqual(analysisRequest);
    });
  });

  describe('findById', () => {
    it('returns an analysis owned by the user', async () => {
      prisma.analysisRequest.findUnique.mockResolvedValue({
        ...analysisRequest,
        result: null,
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
        result: null,
      });

      await expect(
        service.findById('analysis-1', 'user-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('returns only analyses requested for the authenticated user', async () => {
      prisma.analysisRequest.findMany.mockResolvedValue([
        {
          ...analysisRequest,
          result: null,
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
        include: {
          result: true,
        },
      });

      expect(prisma.analysisRequest.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
        },
      });

      expect(result).toEqual({
        items: [
          {
            ...analysisRequest,
            result: null,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
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
        include: {
          result: true,
        },
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
