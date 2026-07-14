import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AnalysisDomain } from '../../generated/prisma/enums';

export class CreateAnalysisDto {
  @ApiProperty({
    description: 'Natural-language question or analysis instruction',
    example: 'Estimate the probability that the home team wins this match.',
    minLength: 3,
    maxLength: 10000,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(10000)
  prompt!: string;

  @ApiProperty({
    description: 'Domain responsible for processing the analysis',
    enum: AnalysisDomain,
    example: AnalysisDomain.SPORTS,
  })
  @IsEnum(AnalysisDomain)
  domain!: AnalysisDomain;

  @ApiPropertyOptional({
    description: 'Conversation associated with the analysis',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiPropertyOptional({
    description: 'Uploaded dataset associated with the analysis',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  datasetId?: string;

  @ApiPropertyOptional({
    description: 'Model version selected for the analysis',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  modelVersionId?: string;

  @ApiPropertyOptional({
    description: 'Domain-specific analysis configuration',
    type: 'object',
    additionalProperties: true,
    example: {
      confidenceThreshold: 0.7,
    },
  })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, unknown>;
}
