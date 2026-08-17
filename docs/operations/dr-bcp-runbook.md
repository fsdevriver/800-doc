# 800-CarWash — Disaster Recovery & Business Continuity Plan

## Selected production model

**Decision: B — VPS + off-site PITR + cold standby.**

The platform will not claim Multi-AZ active/active availability.

## Recovery objectives

```text
Target RPO: < 5 minutes
Target RTO: < 20 minutes
```

These are targets and must be demonstrated by drills.

## Failure scenarios

### Scenario A — Application container failure

Expected:
- restart affected container
- preserve PostgreSQL state
- healthcheck
- validate dependent services

### Scenario B — Redis failure

Expected:
- realtime/cache degradation
- PostgreSQL remains authoritative
- rebuild cache
- repopulate ephemeral specialist locations
- recover/requeue durable outbox work

### Scenario C — Worker failure

Expected:
- restart worker
- pending `outbox_events` remain in PostgreSQL
- retry safely through BullMQ
- duplicate consumer execution must be idempotent

### Scenario D — Primary VPS loss

1. Declare disaster.
2. Freeze unnecessary production mutations.
3. Provision/activate cold-standby VPS.
4. Restore PostgreSQL base backup.
5. Replay WAL to the target recovery point.
6. Restore required application/configuration artifacts.
7. Restore secrets from the approved secret store.
8. Start PostgreSQL.
9. Start API/WebSocket/worker/admin services.
10. Rebuild Redis.
11. Repoint DNS.
12. Run smoke tests.
13. Validate orders, payments, assignments, events, idempotency, and outbox processing.
14. Resume operations.

### Scenario E — PostgreSQL corruption

Use point-in-time recovery to a known-good timestamp.

Do not restore the latest snapshot blindly.

### Scenario F — Credential compromise

1. Revoke compromised credentials.
2. Rotate secrets.
3. Invalidate affected sessions/tokens.
4. Review audit/security logs.
5. Rebuild or re-provision affected infrastructure from known-good artifacts if required.
6. Validate integrity before restoring operations.

## Restore validation

Must verify:

```text
DB connectivity
PostGIS availability
order read/write
order state transition
payment read/write path
idempotency
assignment lease
outbox processing
media access
notifications
admin login
WebSocket reconnect
mobile API connectivity
```

## Evidence

Every DR drill records:
- start time
- detection time
- restore start
- service recovery
- actual RPO
- actual RTO
- data loss
- manual actions
- failed steps
- remediation items

## Drill schedule

- Monthly: restore a production backup in an isolated environment.
- Quarterly: simulate primary-host loss.
- Semi-annually: full DR exercise including DNS cutover.
