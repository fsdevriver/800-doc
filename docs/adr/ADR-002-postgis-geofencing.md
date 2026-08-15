# ADR-002: Spatial Geofencing via PostgreSQL PostGIS

## Status
**ACCEPTED**

## Context
The platform strictly enforces geofenced service coverage within defined Dubai administrative sub-zones (Downtown, Marina, Jumeirah, Arabian Ranches, etc.). Coordinate validation must occur in sub-millisecond timeframes during map pin drops.

## Decision
We utilize **PostgreSQL 17+ with the native PostGIS 3.5+ spatial extension**.

- Sub-zone boundaries are stored as `geometry(Polygon, 4326)`.
- Spatial indices are created using **GIST (Generalized Search Tree)** indices:
  ```sql
  CREATE INDEX idx_sub_zones_boundary_gist ON sub_zones USING GIST (boundary_polygon);
  ```
- Point-in-Polygon (PIP) checks are performed natively via `ST_Contains(boundary_polygon, ST_SetSRID(ST_Point(lng, lat), 4326))`.

## Consequences
### Positive:
- **Sub-millisecond Query Latency**: Spatial GIST indexing returns PIP matches in $<2\text{ ms}$.
- **Zero Third-Party Billing**: Eliminates expensive per-request geofencing API charges from third-party map providers.
- **Complex Geometries**: Supports complex multi-point polygon boundaries and topological editing.

### Negative:
- Requires PostGIS extension enabled on all staging and production database instances.
