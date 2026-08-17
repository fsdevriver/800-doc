# ADR-005: Direct Operations Dispatching vs Autonomous Driver Bidding

## Status
**ACCEPTED**

## Context
Mobile on-demand services often choose between autonomous driver broadcast bidding (where drivers accept/decline jobs with a countdown) or centralized dispatcher assignment. For 800-CarWash Phase 1, fleet control, predictability, and high service fulfillment rates in Dubai are paramount.

## Decision
We enforce **Direct Admin Dispatching with Smart Recommendations (V1.5)**:
- In Phase 1, Operations Dispatchers maintain final authority over assignments via the Admin Web Portal to guarantee fleet control and eliminate driver cherry-picking.
- The platform incorporates a **Heuristic Specialist Recommendation Engine**:
  - Automatically calculates proximity (PostGIS `ST_DistanceSphere` / OSRM routing), technician skill match (e.g. Luxury/Ceramic certification), and daily job load balance.
  - Presents the top 3 recommended specialists to the dispatcher with a "1-Click Assign" shortcut.
- Ops Admin override actions and manual reassignment reasons are tracked as core system metrics to continuously benchmark and train the Phase 2 autonomous proximity dispatch engine.

## Consequences
### Positive:
- **100% Guaranteed Assignment**: Eliminates order abandonment or rejection loops caused by technician cherry-picking.
- **Reduced Dispatch Latency**: Dispatchers can approve top recommendations with a single click instead of manually scanning the map.
- **Continuous Algorithm Calibration**: Collecting dispatcher override metrics creates the ground-truth benchmark for autonomous V2 dispatching.

### Negative:
- Requires active monitoring by Ops Dispatchers during peak operating hours until autonomous dispatch mode is toggled on in Phase 2.

