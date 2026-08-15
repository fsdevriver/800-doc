# ADR-005: Direct Operations Dispatching vs Autonomous Driver Bidding

## Status
**ACCEPTED**

## Context
Mobile on-demand services often choose between autonomous driver broadcast bidding (where drivers accept/decline jobs with a countdown) or centralized dispatcher assignment. For 800-CarWash Phase 1, fleet control, predictability, and high service fulfillment rates in Dubai are paramount.

## Decision
We enforce **Direct Admin Dispatching** in Phase 1:
- Operations Dispatchers manually assign pending orders directly to active specialists via the Admin Web Portal.
- Once assigned by Admin, the specialist's app receives the job immediately.
- The specialist must execute the assignment (there is no decline/timeout auto-rejection mechanism in Phase 1).
- In emergency cases (technician vehicle breakdown, sickness), Ops Admins reassign the job via the Admin Portal.

## Consequences
### Positive:
- **100% Guaranteed Assignment**: Eliminates order abandonment or rejection loops caused by technician cherry-picking.
- **Tightly Controlled Fleet Management**: Ops team maintains complete visual oversight of technician workload and geographic distribution.

### Negative:
- Requires active monitoring by Ops Dispatchers during peak operating hours (automated proximity dispatch will be introduced in Phase 2).
