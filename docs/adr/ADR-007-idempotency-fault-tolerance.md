# ADR-007: API Idempotency Keys, Circuit Breakers & Distributed Fault Tolerance

## Status
**ACCEPTED**

## Context
Mobile applications operating in Dubai underground basements, high-rise parking structures, and suburban zones experience frequent network intermittent drops, timeouts, and aggressive client retries. Without robust idempotency and fault-tolerance patterns, the platform risks duplicate order bookings, duplicate wallet credit deductions, double tip settlements, and cascading failures from external third-party outages (S3, Twilio SMS, Novu Push).

## Decision
We enforce a mandatory fault-tolerance architecture across all mutating API endpoints and external integrations:

1. **Mandatory Client-Side Idempotency Keys**:
   - All state-mutating requests (`POST /api/v1/orders`, `POST /api/v1/payments`, `POST /api/v1/tips`, `POST /api/v1/specialist/orders/:id/*`) must supply an `Idempotency-Key` HTTP header (UUIDv4 or UUIDv7).
   - The NestJS `IdempotencyInterceptor` executes a two-phase check against Redis:
     - If key status is `PENDING`, return `409 Conflict` (request currently in flight).
     - If key status is `RESOLVED`, immediately return the cached response payload with `X-Cache: IDEMPOTENT-HIT` header.
     - New keys are locked in Redis with a 120-second execution lock, transitioning upon successful database commit to a 24-hour persistent cache.

2. **Circuit Breakers for External Providers (Bulkhead Isolation)**:
   - External dependencies (AWS S3 presigned validation, Twilio/Infobip SMS, Novu Push, SendGrid) are isolated behind circuit breakers (`opossum`).
   - If an external provider error rate exceeds 50% over a 10-second rolling window, the circuit opens for 30 seconds:
     - Outbound notifications automatically fall back to an internal durable BullMQ retry queue.
     - Customer checkout and specialist state transitions are **never blocked** by third-party latency.

3. **Database Connection Pool Bulkheads**:
   - PostgreSQL connection pools are segregated:
     - **Core Write Pool (30 connections)**: Dedicated to customer order creation, specialist status changes, and live telemetry.
     - **Reporting/Admin Read Pool (10 connections)**: Dedicated to admin exports and analytics, preventing slow reporting queries from starving live operations.

## Consequences
### Positive:
- **Zero Duplicate Transactions**: Eliminates accidental double bookings and double charges caused by mobile network retries.
- **Cascading Failure Immunity**: Downstream third-party outages do not crash or stall critical ordering and dispatch pipelines.
- **Deterministic State Reconciliation**: Offline mobile clients can safely retry actions upon reconnecting.

### Negative:
- Adds a small Redis latency overhead (~1–2ms) per mutating request.
- Clients must generate and maintain unique UUIDs across retry attempts.
