import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

@Injectable()
export class AnalysesService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateAnalysisDto) {
    return this.prisma.analysisRequest.create({
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
}
