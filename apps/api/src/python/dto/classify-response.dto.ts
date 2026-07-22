import type {
  AnalysisDomain,
  ClassificationMetadata,
  ClassificationTask,
  ClassifierSource,
} from '@forecastme/contracts';
import { plainToInstance } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

const ANALYSIS_DOMAINS = [
  'GENERAL_RESEARCH',
  'CUSTOM_DATASET',
  'SPORTS',
  'FINANCIAL_MARKET',
];

const CLASSIFICATION_TASKS = [
  'GENERAL_RESEARCH',
  'DATASET_ANALYSIS',
  'OUTCOME_FORECAST',
  'DIRECTIONAL_FORECAST',
  'COMPARISON',
  'RISK_ASSESSMENT',
  'UNSUPPORTED',
];

const CLASSIFIER_SOURCES = ['LLM', 'RULE_BASED_FALLBACK'];

export class InvalidPythonClassificationResponseError extends Error {
  constructor() {
    super('Python service returned an invalid classification response');
    this.name = InvalidPythonClassificationResponseError.name;
  }
}

export class ClassifyResponseDto implements ClassificationMetadata {
  @IsIn(ANALYSIS_DOMAINS)
  domain!: AnalysisDomain;

  @IsIn(CLASSIFICATION_TASKS)
  task!: ClassificationTask;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  @IsString()
  @MinLength(1)
  reasoning!: string;

  @IsBoolean()
  isSupported!: boolean;

  @IsArray()
  @IsString({ each: true })
  entities!: string[];

  @IsArray()
  @IsString({ each: true })
  dates!: string[];

  @ValidateIf((_object, value: unknown) => value !== null)
  @IsString()
  timeHorizon!: string | null;

  @IsBoolean()
  requiresLiveData!: boolean;

  @IsIn(CLASSIFIER_SOURCES)
  classifier!: ClassifierSource;

  @IsBoolean()
  predictionIntent!: boolean;

  @IsBoolean()
  comparisonIntent!: boolean;

  @IsBoolean()
  riskIntent!: boolean;
}

export function validatePythonClassificationResponse(
  value: unknown,
): ClassificationMetadata {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new InvalidPythonClassificationResponseError();
  }

  const response = plainToInstance(ClassifyResponseDto, value);

  const errors = validateSync(response, {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
  });

  if (errors.length > 0) {
    throw new InvalidPythonClassificationResponseError();
  }

  return response;
}
