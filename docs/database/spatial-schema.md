# Spatial Geofencing & Sub-Zones Schema

This document details the PostgreSQL PostGIS database structures used to store polygon boundaries, service areas, and slot scheduling limits.

---

## 1. PostGIS Spatial Tables

### `service_zones`
Master city / emirate-level geographic container.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Zone identifier. |
| `name` | `VARCHAR(100)` | `NOT NULL` | City name (e.g. `Dubai Metropolitan`). |
| `boundary_polygon` | `GEOMETRY(Polygon, 4326)` | `NOT NULL` | Outer bounding polygon in WGS 84. |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | City service active switch. |

---

### `sub_zones`
Operational dispatch clusters used for team assignment and scheduling capacity.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Sub-zone identifier. |
| `service_zone_id` | `UUID` | `FK -> service_zones(id), ON DELETE CASCADE` | Parent city zone. |
| `name` | `VARCHAR(100)` | `NOT NULL` | Territory name (e.g., `Downtown Dubai & Business Bay`). |
| `code` | `VARCHAR(50)` | `UNIQUE, NOT NULL` | Unique code (e.g. `DXB-DOWNTOWN`). |
| `boundary_polygon` | `GEOMETRY(Polygon, 4326)` | `NOT NULL` | Exact territorial polygon boundary. |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Active dispatch flag. |

```sql
-- Spatial GIST Index for ultra-fast Point-in-Polygon searches
CREATE INDEX idx_sub_zones_boundary_gist ON sub_zones USING GIST (boundary_polygon);
```

---

### `slot_capacities`
Admin-configured booking quotas per sub-zone and time window.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique record identifier. |
| `sub_zone_id` | `UUID` | `FK -> sub_zones(id), ON DELETE CASCADE` | Target operational territory. |
| `day_of_week` | `INTEGER` | `NOT NULL (0=Sunday ... 6=Saturday)` | Day of recurring schedule. |
| `slot_start_time` | `TIME` | `NOT NULL` | Start time (e.g., `09:00:00`). |
| `max_capacity` | `INTEGER` | `NOT NULL, DEFAULT 4` | Maximum allowable simultaneous bookings. |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Slot active status. |

---

## 2. Essential PostGIS Query Patterns

### Point-in-Polygon (PIP) Service Area Check
To check if a customer's pin falls within an active sub-zone:

```sql
SELECT 
    sz.id AS sub_zone_id,
    sz.name AS sub_zone_name,
    z.name AS city_name
FROM sub_zones sz
JOIN service_zones z ON sz.service_zone_id = z.id
WHERE sz.is_active = TRUE 
  AND z.is_active = TRUE
  AND ST_Contains(
      sz.boundary_polygon, 
      ST_SetSRID(ST_Point(:longitude, :latitude), 4326)
  )
LIMIT 1;
```
