# ADR-009: Production Topology — VPS + Off-Site PITR + Cold Standby

## Status

Accepted

## Decision

Use a dedicated primary VPS for production workloads with:
- PostgreSQL 18 + PostGIS
- Redis 7.4
- API
- WebSocket
- worker
- admin

Use:
- continuous PostgreSQL WAL archiving
- nightly encrypted DB backups
- weekly infrastructure/config backups
- independent off-site backup storage
- a cold-standby VPS recovery procedure
- DNS cutover during disaster

## Why

This matches the current operational model while providing a practical recovery path without prematurely introducing Kubernetes/Multi-AZ complexity.

## Consequences

### Positive

- Lower operational complexity
- Predictable cost
- Straightforward deployment
- Clear DR path
- PostgreSQL remains authoritative

### Negative

- Single-primary-host architecture has a larger failure domain
- Failover is not instantaneous
- Requires tested restore/failover discipline
- Does not provide Multi-AZ active/active availability

## Non-goals

This decision does not claim:
- zero-downtime infrastructure failover
- Multi-AZ active/active operation
- synchronous regional database replication

## Required follow-up

Run DR drills to prove the target RPO < 5 minutes and RTO < 20 minutes.
