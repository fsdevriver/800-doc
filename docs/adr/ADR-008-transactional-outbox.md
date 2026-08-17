# 800-CarWash — Transactional Outbox Schema Decision

## Purpose

Make the worker's Transactional Outbox architecture explicit in the database model.

## Table

```sql
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    event_type TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    aggregate_id UUID NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    attempts INTEGER NOT NULL DEFAULT 0,
    available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_at TIMESTAMPTZ NULL,
    locked_by TEXT NULL,
    published_at TIMESTAMPTZ NULL,
    failed_at TIMESTAMPTZ NULL,
    last_error TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Recommended constraints

- `status` restricted to `PENDING`, `PROCESSING`, `PUBLISHED`, `FAILED`, `DEAD_LETTER`
- non-negative `attempts`
- non-null aggregate identifiers
- indexes for pending work and aggregate lookup

## Processing

Use a database-safe claim strategy so multiple workers cannot process the same pending row simultaneously without coordination.

Example conceptual query:

```sql
SELECT id
FROM outbox_events
WHERE status = 'PENDING'
  AND available_at <= NOW()
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 50;
```

Claim rows within a transaction, then process outside the lock where appropriate, using a durable status transition.

The exact implementation must be tested against the chosen worker concurrency model.
