import type { AnalysisResult } from '@forecastme/contracts';
import { Type, plainToInstance } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsIn,
  IsISO8601,
  IsNumber,
  IsString,
  IsUrl,
  Max,
  Min,
  Matches,
  MinLength,
  ValidateIf,
  ValidateNested,
  validateSync,
} from 'class-validator';

const resultLevels = ['LOW', 'MEDIUM', 'HIGH'] as const;
const evidenceImpacts = ['SUPPORTS', 'OPPOSES', 'NEUTRAL'] as const;
const freshnessStatuses = ['CURRENT', 'AGING', 'STALE', 'UNKNOWN'] as const;
const terminalStatuses = ['COMPLETED', 'FAILED'] as const;

export type PythonAnalysisStatus = (typeof terminalStatuses)[number];

class AnalysisConfidenceDto {
  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(1)
  score!: number | null;

  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsIn(resultLevels)
  level!: (typeof resultLevels)[number] | null;

  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsString()
  explanation!: string | null;
}

class EvidenceItemDto {
  @IsString()
  @MinLength(1)
  id!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsIn(evidenceImpacts)
  impact!: (typeof evidenceImpacts)[number] | null;

  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsIn(resultLevels)
  strength!: (typeof resultLevels)[number] | null;
}

class RiskFactorDto {
  @IsString()
  @MinLength(1)
  id!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsIn(resultLevels)
  severity!: (typeof resultLevels)[number] | null;
}

class AnalysisSourceDto {
  @IsDefined()
  @IsString()
  @MinLength(1)
  id!: string;

  @IsDefined()
  @IsString()
  @MinLength(1)
  title!: string;

  @IsDefined()
  @IsUrl({ require_protocol: true })
  url!: string;

  @IsDefined()
  @IsString()
  @MinLength(1)
  publisher!: string;

  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/(?:Z|[+-]\d{2}:\d{2})$/)
  publicationDate!: string | null;

  @IsDefined()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/(?:Z|[+-]\d{2}:\d{2})$/)
  retrievedAt!: string;

  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsString()
  snippet!: string | null;
}

class ModelInformationDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  version!: string;

  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsString()
  method!: string | null;
}

class DataFreshnessDto {
  @IsISO8601({ strict: true, strictSeparator: true })
  generatedAt!: string;

  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsISO8601({ strict: true, strictSeparator: true })
  dataAsOf!: string | null;

  @IsIn(freshnessStatuses)
  status!: (typeof freshnessStatuses)[number];
}

class AnalysisResultDto implements AnalysisResult {
  @IsString()
  @MinLength(1)
  directAnswer!: string;

  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(1)
  probability!: number | null;

  @IsDefined()
  @ValidateNested()
  @Type(() => AnalysisConfidenceDto)
  confidence!: AnalysisConfidenceDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvidenceItemDto)
  evidence!: EvidenceItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RiskFactorDto)
  riskFactors!: RiskFactorDto[];

  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsString()
  suggestedAction!: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalysisSourceDto)
  sources!: AnalysisSourceDto[];

  @IsDefined()
  @ValidateNested()
  @Type(() => ModelInformationDto)
  model!: ModelInformationDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => DataFreshnessDto)
  dataFreshness!: DataFreshnessDto;
}

class AnalysisErrorDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  @MinLength(1)
  message!: string;
}

class PythonAnalysisResponseDto {
  @IsString()
  @MinLength(1)
  analysisId!: string;

  @IsIn(terminalStatuses)
  status!: PythonAnalysisStatus;

  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @ValidateNested()
  @Type(() => AnalysisResultDto)
  result!: AnalysisResultDto | null;

  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  processingTimeMs!: number | null;

  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @ValidateNested()
  @Type(() => AnalysisErrorDto)
  error!: AnalysisErrorDto | null;
}

export interface PythonAnalysisResponse {
  analysisId: string;
  status: PythonAnalysisStatus;
  result: AnalysisResult | null;
  processingTimeMs: number | null;
  error: {
    code: string;
    message: string;
  } | null;
}

export class InvalidPythonAnalysisResponseError extends Error {
  constructor() {
    super('Python analysis response failed contract validation');
    this.name = InvalidPythonAnalysisResponseError.name;
  }
}

export function validatePythonAnalysisResponse(
  value: unknown,
  expectedAnalysisId: string,
): PythonAnalysisResponse {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new InvalidPythonAnalysisResponseError();
  }

  const response = plainToInstance(PythonAnalysisResponseDto, value);

  const errors = validateSync(response, {
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    whitelist: true,
  });

  if (errors.length > 0 || response.analysisId !== expectedAnalysisId) {
    throw new InvalidPythonAnalysisResponseError();
  }

  const confidence = response.result?.confidence;

  const confidenceIsConsistent =
    !confidence || (confidence.score === null) === (confidence.level === null);

  const payloadMatchesStatus =
    (response.status === 'COMPLETED' &&
      response.result !== null &&
      response.error === null) ||
    (response.status === 'FAILED' &&
      response.result === null &&
      response.error !== null);

  const timestampsAreUtc =
    response.result === null ||
    (response.result.dataFreshness.generatedAt.endsWith('Z') &&
      (response.result.dataFreshness.dataAsOf === null ||
        response.result.dataFreshness.dataAsOf.endsWith('Z')) &&
      response.result.sources.every(
        (source) =>
          source.retrievedAt.endsWith('Z') &&
          (source.publicationDate === null ||
            source.publicationDate.endsWith('Z')),
      ));

  if (!confidenceIsConsistent || !payloadMatchesStatus || !timestampsAreUtc) {
    throw new InvalidPythonAnalysisResponseError();
  }

  return response;
}
