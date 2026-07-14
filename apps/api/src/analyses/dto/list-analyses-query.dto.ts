import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { AnalysisDomain, AnalysisStatus } from '../../generated/prisma/enums';

export class ListAnalysesQueryDto {
  @ApiPropertyOptional({
    description: 'Filter analyses by lifecycle status',
    enum: AnalysisStatus,
  })
  @IsOptional()
  @IsEnum(AnalysisStatus)
  status?: AnalysisStatus;

  @ApiPropertyOptional({
    description: 'Filter analyses by analysis domain',
    enum: AnalysisDomain,
  })
  @IsOptional()
  @IsEnum(AnalysisDomain)
  domain?: AnalysisDomain;

  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of analyses returned per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
