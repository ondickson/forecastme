import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PythonService } from '../python/python.service';
import { CreateAnalysisDto } from './dto';
import { Prisma } from '../generated/prisma/client';
import { AnalysisDomain, AnalysisStatus } from '../generated/prisma/enums';

interface ListAnalysesOptions {
  userId: string;
  page: number;
  limit: number;
  status?: AnalysisStatus;
  domain?: AnalysisDomain;
}

const PYTHON_DOMAIN_MAP = {
  [AnalysisDomain.GENERAL_RESEARCH]: 'general_research',
  [AnalysisDomain.CUSTOM_DATASET]: 'custom_dataset',
  [AnalysisDomain.SPORTS]: 'sports',
  [AnalysisDomain.FINANCIAL_MARKET]: 'financial_market',
} as const;

@Injectable()
export class AnalysesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pythonService: PythonService,
  ) {}

  async create(userId: string, dto: CreateAnalysisDto) {
    const analysis = await this.prisma.analysisRequest.create({
      data: {
        userId,
        prompt: dto.prompt,
        domain: dto.domain,
        conversationId: dto.conversationId,
        datasetId: dto.datasetId,
        modelVersionId: dto.modelVersionId,
        parameters: dto.parameters as Prisma.InputJsonValue | undefined,
      },
    });

    try {
      await this.prisma.analysisRequest.update({
        where: {
          id: analysis.id,
        },
        data: {
          status: AnalysisStatus.COLLECTING_DATA,
          startedAt: new Date(),
          errorCode: null,
          errorMessage: null,
        },
      });

      await this.updateStatus(analysis.id, AnalysisStatus.ANALYZING);

      const pythonResponse = await this.pythonService.analyze({
        analysisId: analysis.id,
        question: dto.prompt,
        domain: PYTHON_DOMAIN_MAP[dto.domain],
        options: dto.parameters,
        correlationId: analysis.id,
      });
      await this.prisma.$transaction([
        this.prisma.analysisResult.create({
          data: {
            analysisRequestId: analysis.id,
            summary: pythonResponse.summary,
            content: pythonResponse as unknown as Prisma.InputJsonValue,
            probability: pythonResponse.result.probability,
            confidence: pythonResponse.result.confidence,
            riskScore: null,
          },
        }),
        this.prisma.analysisRequest.update({
          where: {
            id: analysis.id,
          },
          data: {
            status: AnalysisStatus.COMPLETED,
            completedAt: new Date(),
            errorCode: null,
            errorMessage: null,
          },
          include: {
            result: true,
          },
        }),
      ]);

      return this.findById(analysis.id, userId);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Analysis processing failed';

      await this.markFailed(analysis.id, message);

      throw error;
    }
  }

  async findById(id: string, userId: string) {
    const analysis = await this.prisma.analysisRequest.findUnique({
      where: {
        id,
      },
      include: {
        result: true,
      },
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    if (analysis.userId !== userId) {
      throw new ForbiddenException('You do not have access to this analysis');
    }

    return analysis;
  }

  async findAll(options: ListAnalysesOptions) {
    const where = {
      userId: options.userId,
      ...(options.status && {
        status: options.status,
      }),
      ...(options.domain && {
        domain: options.domain,
      }),
    };

    const skip = (options.page - 1) * options.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.analysisRequest.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: options.limit,
        include: {
          result: true,
        },
      }),
      this.prisma.analysisRequest.count({
        where,
      }),
    ]);

    return {
      items,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async delete(id: string, userId: string) {
    const analysis = await this.prisma.analysisRequest.findUnique({
      where: {
        id,
      },
    });

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    if (analysis.userId !== userId) {
      throw new ForbiddenException('You do not have access to this analysis');
    }

    await this.prisma.analysisRequest.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
    };
  }
  private async updateStatus(analysisId: string, status: AnalysisStatus) {
    return this.prisma.analysisRequest.update({
      where: {
        id: analysisId,
      },
      data: {
        status,
      },
    });
  }

  private async markFailed(analysisId: string, message: string) {
    await this.prisma.analysisRequest.update({
      where: {
        id: analysisId,
      },
      data: {
        status: AnalysisStatus.FAILED,
        errorCode: 'ANALYSIS_SERVICE_ERROR',
        errorMessage: message,
        completedAt: new Date(),
      },
    });
  }
}
