import {
  InvalidPythonClassificationResponseError,
  validatePythonClassificationResponse,
} from './classify-response.dto';

describe('validatePythonClassificationResponse', () => {
  const validResponse = {
    domain: 'FINANCIAL_MARKET',
    task: 'DIRECTIONAL_FORECAST',
    confidence: 0.9,
    reasoning: 'The prompt contains financial-market terminology.',
    isSupported: true,
    entities: ['Apple'],
    dates: ['2026-07-25'],
    timeHorizon: 'within 3 months',
    requiresLiveData: true,
    classifier: 'RULE_BASED_FALLBACK',
    predictionIntent: true,
    comparisonIntent: false,
    riskIntent: true,
  };

  it('accepts complete canonical classification metadata', () => {
    expect(validatePythonClassificationResponse(validResponse)).toEqual(
      validResponse,
    );
  });

  it('accepts an unsupported request using a canonical domain', () => {
    const response = {
      ...validResponse,
      domain: 'GENERAL_RESEARCH',
      task: 'UNSUPPORTED',
      isSupported: false,
      requiresLiveData: false,
    };

    expect(validatePythonClassificationResponse(response)).toEqual(response);
  });

  it('accepts LLM as the classifier source', () => {
    const response = {
      ...validResponse,
      classifier: 'LLM',
    };

    expect(validatePythonClassificationResponse(response)).toEqual(response);
  });

  it('rejects UNSUPPORTED as a domain', () => {
    expect(() =>
      validatePythonClassificationResponse({
        ...validResponse,
        domain: 'UNSUPPORTED',
        task: 'UNSUPPORTED',
        isSupported: false,
      }),
    ).toThrow(InvalidPythonClassificationResponseError);
  });

  it('rejects an unknown task', () => {
    expect(() =>
      validatePythonClassificationResponse({
        ...validResponse,
        task: 'UNKNOWN_TASK',
      }),
    ).toThrow(InvalidPythonClassificationResponseError);
  });

  it('rejects an unknown classifier source', () => {
    expect(() =>
      validatePythonClassificationResponse({
        ...validResponse,
        classifier: 'UNKNOWN_CLASSIFIER',
      }),
    ).toThrow(InvalidPythonClassificationResponseError);
  });

  it('rejects lowercase legacy domains', () => {
    expect(() =>
      validatePythonClassificationResponse({
        ...validResponse,
        domain: 'financial_market',
      }),
    ).toThrow(InvalidPythonClassificationResponseError);
  });

  it('rejects a response without isSupported', () => {
    const response: Partial<typeof validResponse> = {
      ...validResponse,
    };

    delete response.isSupported;

    expect(() => validatePythonClassificationResponse(response)).toThrow(
      InvalidPythonClassificationResponseError,
    );
  });

  it('rejects a response without requiresLiveData', () => {
    const response: Partial<typeof validResponse> = {
      ...validResponse,
    };

    delete response.requiresLiveData;

    expect(() => validatePythonClassificationResponse(response)).toThrow(
      InvalidPythonClassificationResponseError,
    );
  });

  it('rejects unexpected response properties', () => {
    expect(() =>
      validatePythonClassificationResponse({
        ...validResponse,
        internalDebugInformation: 'must not be accepted',
      }),
    ).toThrow(InvalidPythonClassificationResponseError);
  });
});
