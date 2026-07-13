import {
  AnalysisDomain,
  AnalysisStatus,
  type CreateAnalysisRequest,
} from "@forecastme/contracts";

export const exampleAnalysisRequest: CreateAnalysisRequest = {
  question: "What is the probability that Team A defeats Team B?",
  domain: AnalysisDomain.SPORTS,
  options: {
    includeExplanation: true,
    includeConfidence: true,
    riskTolerance: "medium",
  },
};

export const exampleAnalysisStatus = AnalysisStatus.PENDING;