# ADR-002: General Research Search Provider

## Status

Accepted

## Date

2026-07-24

## Decision Owners

ForecastMe Engineering

---

## Context

ForecastMe must retrieve current web sources for questions classified as `GENERAL_RESEARCH`.

The General Research workflow requires normalized source records containing a title, URL, publisher or domain, publication date when available, retrieval time, and snippet.

The initial release does not require multiple search providers, crawling infrastructure, web scraping, queues, caching, provider fallback, or complex retry behavior.

OpenRouter is already used for LLM-assisted domain classification and will later support AI-generated explanations. Search retrieval should remain a separate responsibility so that source collection is explicit, testable, and independent of LLM generation.

---

## Decision

ForecastMe will integrate directly with Exa as the single V1 web-search provider.

### Provider request

```text
Method: POST
Endpoint: https://api.exa.ai/search
Authentication header: x-api-key: <EXA_API_KEY>
Content-Type: application/json
```

The minimum request body will be:

```json
{
  "query": "the general-research question",
  "type": "auto",
  "numResults": 5,
  "contents": {
    "highlights": true
  }
}
```

ForecastMe will not request full-page text, generated summaries, deep-search output, or other extended Exa features during V1.

### Responsibility boundaries

```text
OpenRouter
- Domain classification
- Future AI-assisted explanations

Exa
- General-research web search
- Search-result metadata and highlights
```

OpenRouter will not perform web search or generate source records.

### Environment settings

The Python Analysis Service will use:

```env
EXA_API_KEY=
EXA_SEARCH_RESULT_LIMIT=5
EXA_SEARCH_TIMEOUT_SECONDS=10
```

The real API key must exist only in an ignored local environment file or a deployment secret store.

The committed `.env.example` file must contain an empty placeholder.

The Analysis Service may start without an Exa API key, but a general-research search operation must fail through the existing error contract when Exa is unavailable or unconfigured.

### Client design

ForecastMe will implement one asynchronous `search_with_exa()` function using the existing `httpx.AsyncClient` dependency.

The function will be injected directly into `GeneralResearchHandler`.

V1 will not introduce:

- A provider registry
- A provider interface hierarchy
- A provider factory
- A fallback provider
- Automatic retries
- Crawling or scraping
- Search-result caching
- Background queues
- Full-page extraction

### Source normalization

Each usable Exa result will be normalized into the existing ForecastMe analysis-source model.

| ForecastMe field | Exa value or derivation |
|---|---|
| `id` | Deterministic hash of the normalized URL |
| `title` | `results[].title` |
| `url` | `results[].url` |
| `publisher` | Normalized hostname derived from the URL |
| `publicationDate` | `results[].publishedDate`, otherwise `null` |
| `retrievedAt` | One timezone-aware UTC timestamp for the search operation |
| `snippet` | First usable `results[].highlights` value, otherwise `null` |

Results will be deduplicated by normalized URL while preserving Exa's ranking order.

ForecastMe will attach no more than five usable unique sources to the existing `AnalysisResult`.

### Failure mapping

Provider failures will be translated into ForecastMe's existing standardized error response. The existing request ID must be preserved.

| Provider condition | ForecastMe response |
|---|---|
| Request timeout | HTTP `504` with `SERVICE_UNAVAILABLE` |
| Connection or DNS failure | HTTP `503` with `SERVICE_UNAVAILABLE` |
| Missing API key or HTTP `401`/`403` | HTTP `503` with `SERVICE_UNAVAILABLE` |
| HTTP `429` | HTTP `503` with `SERVICE_UNAVAILABLE` |
| HTTP `5xx` | HTTP `503` with `SERVICE_UNAVAILABLE` |
| Malformed successful response | HTTP `502` with `SERVICE_UNAVAILABLE` |
| No usable normalized results | HTTP `404` with `NOT_FOUND` |

Errors must not expose the Exa API key, authorization headers, or raw provider response bodies.

### Application flow

```text
GeneralResearchHandler
        ->
search_with_exa()
        ->
Normalize and deduplicate results
        ->
Attach sources to AnalysisResult
        ->
NestJS persists the result normally
```

The implementation will remain asynchronous throughout the Python request path.

---

## Rationale

Direct Exa integration gives ForecastMe an explicit and testable search boundary.

It separates retrieval from LLM classification and explanation, prevents unnecessary coupling to OpenRouter's optional search features, and produces predictable source records for persistence.

A single provider and client are sufficient for the V1 workload.

---

## Alternatives Considered

### OpenRouter web-search integration

OpenRouter can expose web-search results through model requests.

This option was rejected because:

- Search retrieval would become coupled to LLM generation.
- Source parsing would depend on model-response annotations.
- Provider behavior would be less explicit.
- Search testing and failure handling would be harder to isolate.
- ForecastMe already uses OpenRouter for separate intelligence responsibilities.

### Multiple search providers

Supporting multiple providers was rejected for V1 because:

- No fallback requirement has been demonstrated.
- Provider abstractions would add implementation and testing overhead.
- One provider is sufficient to prove the general-research workflow.

### Direct crawling and scraping

Crawling and scraping were rejected because:

- Search-result metadata is sufficient for the V1 source record.
- Crawling introduces robots, content extraction, blocking, and compliance concerns.
- Full-page extraction is not required for Day 21.

### Retries, caching, and queues

These were rejected because:

- No measured reliability or throughput requirement currently justifies them.
- They introduce additional state and failure modes.
- The current request path can use one bounded asynchronous provider call.

---

## Consequences

### Positive consequences

- Clear separation between LLM intelligence and web retrieval
- One explicit provider integration
- Predictable request limits and timeout behavior
- Normalized source records
- Straightforward provider-mocked tests
- No premature provider abstraction
- Reduced V1 implementation complexity

### Negative consequences

- General research depends on Exa availability.
- Provider rate limits can temporarily prevent searches.
- No fallback exists if Exa is unavailable.
- Search quality is limited to the selected provider.
- Full-page content is not collected during V1.

### Risks

- Exa response fields may be missing or malformed.
- Duplicate URLs may appear in search results.
- Provider failures could leak implementation details.
- A missing API key could make general research unavailable.

### Mitigations

- Validate provider output before normalization.
- Deduplicate normalized URLs.
- Enforce a five-result cap and ten-second timeout.
- Translate failures into the existing ForecastMe error contract.
- Preserve request IDs in all failures.
- Never expose secrets or raw provider responses.
- Add provider-mocked tests for success, timeout, malformed output, and empty results.

---

## Implementation Rules

1. Exa is the only V1 general-research search provider.
2. The provider endpoint remains a code constant.
3. Authentication uses the `x-api-key` header.
4. The implementation must use asynchronous HTTP.
5. No more than five usable unique results may be returned.
6. Each request must have an explicit ten-second timeout.
7. URLs must be normalized and deduplicated while preserving provider order.
8. Sources must use the existing `AnalysisResult` structure.
9. Provider failures must use the existing error contract and request ID.
10. Secrets and raw provider response bodies must not appear in errors or logs.
11. No fallback, crawling, scraping, caching, queues, or automatic retries will be added during V1.
12. Any expansion to multiple providers requires a new architecture decision.

---

## Future Review Triggers

This decision should be reviewed when:

- Exa reliability or search quality becomes inadequate.
- Search volume makes provider cost or rate limits material.
- A supported workflow requires full-page content extraction.
- A contractual requirement demands a different source provider.
- Measured failures justify bounded retries or fallback behavior.
- Multiple providers are required for coverage or resilience.
- Search requests must move to background execution.