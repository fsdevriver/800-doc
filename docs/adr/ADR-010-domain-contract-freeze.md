# ADR-010: Freeze Core Domain Contracts Before Feature Implementation

## Status

Accepted

## Frozen contracts

The following are considered canonical contracts for the current implementation phase:

```text
Order:
  fulfillment_status
  assignment_status
  payment_status
  cancellation_status

OrderItem:
  execution_status

Assignment:
  lease/version authority

Pricing:
  immutable checkout snapshot

Payment:
  append-only financial history + refunds

Idempotency:
  actor + key + request hash + durable result

OrderEvent:
  immutable business history

OutboxEvent:
  durable asynchronous delivery work
```

## Rule

A feature that changes one of these contracts must update, as applicable:

- business requirements
- system design
- database schema
- API contract
- mobile flow
- admin flow
- custom agent skills
- unit/integration/E2E tests
- audit/observability rules

## Reason

These contracts are cross-cutting. Allowing local module interpretation would create inconsistent behavior and undermine the modular monolith.
