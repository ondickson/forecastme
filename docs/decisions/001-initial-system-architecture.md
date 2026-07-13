# ADR-001: Initial ForecastMe System Architecture

## Status

Accepted

## Date

2026-07-13

## Decision Owners

ForecastMe Engineering

---

## Context

ForecastMe is being developed as a general predictive intelligence platform.

The system must support multiple forecasting domains, including sports, betting, stocks, cryptocurrency, economics, weather, risk, and user-provided datasets.

The project requires both application-development capabilities and numerical or machine-learning capabilities.

The application layer benefits from TypeScript and NestJS, while the analytical layer benefits from Python and its data-science ecosystem.

The system also requires durable relational storage, fast temporary storage, and storage for large uploaded files and generated artifacts.

At this stage, the project does not have operational requirements that justify advanced distributed infrastructure such as Kafka or Kubernetes.

---

## Decision

ForecastMe will use the following initial architecture:

### Presentation layer

```text
Next.js Web Application
```

### Application and orchestration layer

```text
NestJS Core API
```

### Analytics layer

```text
Python FastAPI Analysis Service
```

### Infrastructure services

```text
PostgreSQL
Redis
Object Storage
```

The principal communication path will be:

```text
Next.js Web Application
        ↓
NestJS Core API
        ↓
Python Analysis Service
        ↓
PostgreSQL / Redis / Object Storage
```

The Next.js application will communicate with the NestJS Core API.

The NestJS Core API will act as the application gateway and orchestration layer.

The Python Analysis Service will contain statistical, numerical, data-processing, and machine-learning functionality.

PostgreSQL will serve as the durable system of record.

Redis will provide caching and temporary state.

Object storage will store uploaded datasets, generated reports, model artifacts, and other large files.

Kafka and Kubernetes will not be added during the initial phase.

---

## Rationale

### NestJS for the Core API

NestJS provides:

- Strong TypeScript support
- Dependency injection
- Modular application structure
- Guards and interceptors
- Request validation
- OpenAPI integration
- REST and GraphQL support
- gRPC support
- Testable service boundaries

It is appropriate for authentication, authorization, orchestration, persistence, and public API management.

### Python for analytics

Python provides a mature ecosystem for:

- Data analysis
- Statistics
- Machine learning
- Numerical computation
- Feature engineering
- Model evaluation
- Probability estimation

The Analysis Service can use libraries such as:

- pandas
- Polars
- NumPy
- SciPy
- scikit-learn
- XGBoost
- LightGBM

### PostgreSQL for durable data

PostgreSQL provides:

- Strong relational modeling
- Transactions
- Data integrity
- Indexing
- JSON support
- Mature tooling
- Reliable production hosting options

### Redis for temporary state

Redis provides:

- Low-latency caching
- Expiring values
- Atomic counters
- Rate-limiting support
- Temporary job state
- Idempotency support

### Object storage for files

Object storage is better suited than PostgreSQL for:

- Large datasets
- Reports
- Exports
- Model files
- Binary artifacts

The database will store metadata and object references rather than large binary content.

---

## Alternatives Considered

## Single Next.js full-stack application

This option would place the frontend, application API, and possibly analysis logic inside one Next.js project.

It was rejected because:

- Python analytical tooling would be awkward to integrate.
- Service responsibilities would become mixed.
- Independent scaling would be difficult.
- The application would become increasingly difficult to maintain.

## NestJS-only backend

This option would implement both application logic and prediction logic in TypeScript.

It was rejected because:

- The Python analytics ecosystem is significantly stronger.
- Most planned machine-learning libraries are Python-first.
- Numerical workflows would be less natural to implement.
- Model-development workflows would be constrained.

## Python-only backend

This option would implement application APIs and analytical logic in one Python service.

It was rejected because:

- The project requires substantial application orchestration.
- NestJS provides stronger conventions for the planned TypeScript application layer.
- Separating analytical logic prevents the Python service from becoming a monolith.
- The selected architecture demonstrates polyglot service design.

## Kafka during the foundation phase

Kafka was considered for asynchronous communication and event processing.

It was rejected for the initial phase because:

- Current request volume does not require event streaming.
- No event-replay requirement exists yet.
- No multiple-consumer event topology exists yet.
- It would increase development and operational complexity.
- Direct HTTP communication is currently sufficient.

## Kubernetes during the foundation phase

Kubernetes was considered for container orchestration.

It was rejected for the initial phase because:

- The application does not yet require cluster orchestration.
- Service scale is currently limited.
- Kubernetes would add unnecessary deployment complexity.
- Simpler deployment systems are sufficient for early releases.

---

## Consequences

### Positive consequences

- Clear separation between UI, application logic, and analytics
- Independent service development
- Independent service deployment
- Access to the TypeScript and Python ecosystems
- Easier domain expansion
- Better testing boundaries
- Reduced frontend access to internal infrastructure
- Scalable database and file-storage model
- Architecture suitable for a professional portfolio project

### Negative consequences

- More than one programming language must be maintained
- Internal service contracts must be versioned
- Local development requires multiple processes
- Distributed tracing and error handling are more complex
- Network failures must be handled between services
- Shared data structures cannot be assumed automatically

### Risks

- The Core API could become an oversized orchestration service.
- The Analysis Service could become a collection of unrelated domain logic.
- Internal contracts could drift between TypeScript and Python.
- Direct database access from multiple services could create ownership confusion.
- Redis could be incorrectly treated as permanent storage.

### Mitigations

- Organize the Core API by domain modules.
- Organize the Analysis Service by analytical domain and workflow.
- Define versioned shared contracts.
- Establish explicit data ownership.
- Store durable records in PostgreSQL.
- Require expiration policies for Redis keys.
- Document all service boundaries.
- Add contract testing as the system develops.

---

## Implementation Rules

1. The browser must call the NestJS Core API.
2. The browser must not directly call internal infrastructure.
3. The Analysis Service must expose structured endpoints.
4. Public and internal contracts must be explicitly defined.
5. PostgreSQL must remain the durable system of record.
6. Redis must be treated as temporary storage.
7. Large files must be placed in object storage.
8. Kafka must not be introduced without an event-streaming requirement.
9. Kubernetes must not be introduced without demonstrated orchestration requirements.
10. Architecture changes must be recorded in additional ADR files.

---

## Future Review Triggers

This decision should be reviewed when any of the following occurs:

- Analysis requests routinely exceed normal HTTP request durations
- Multiple services must consume the same domain events
- The platform begins processing continuous market-data streams
- Model-training jobs require background execution
- Deployment requires automatic multi-node scaling
- The number of services materially increases
- Cross-service failures become difficult to manage
- The platform requires regional redundancy
- Regulatory or audit requirements change data boundaries

A review does not automatically mean Kafka or Kubernetes should be adopted. It means the architecture should be evaluated against measured requirements.
