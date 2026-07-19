# Analysis result contract

ForecastMe uses one canonical analysis-result structure across the Python prediction service, NestJS API, database storage, and Next.js frontend.

## Standard result sections

Every completed analysis contains these nine sections:

1. Direct answer
2. Probability
3. Confidence
4. Evidence
5. Risk factors
6. Suggested action
7. Sources
8. Model information
9. Data freshness

## Canonical structure

```ts
interface AnalysisResult {
  directAnswer: string;
  probability: number | null;
  confidence: {
    score: number | null;
    level: 'LOW' | 'MEDIUM' | 'HIGH' | null;
    explanation: string | null;
  };
  evidence: Array<{
    id: string;
    title: string;
    description: string;
    impact: 'SUPPORTS' | 'OPPOSES' | 'NEUTRAL' | null;
    strength: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  }>;
  riskFactors: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  }>;
  suggestedAction: string | null;
  sources: Array<{
    id: string;
    title: string;
    url: string | null;
    publisher: string | null;
    retrievedAt: string | null;
  }>;
  model: {
    name: string;
    version: string;
    method: string | null;
  };
  dataFreshness: {
    generatedAt: string;
    dataAsOf: string | null;
    status: 'CURRENT' | 'AGING' | 'STALE' | 'UNKNOWN';
  };
}
```
