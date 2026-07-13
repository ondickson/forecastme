// forecastme/apps/api/src/contracts-test.ts

import {
  AnalysisDomain,
  AnalysisStatus,
  type AnalysisServiceRequest,
} from "@forecastme/contracts";

export const exampleInternalRequest: AnalysisServiceRequest = {
  analysisId: "analysis_test_001",
  question: "What is the probability that Team A defeats Team B?",
  domain: AnalysisDomain.SPORTS,
  options: {
    includeExplanation: true,
  },
  correlationId: "correlation_test_001",
};

export const exampleStatus = AnalysisStatus.PROCESSING;