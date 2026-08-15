# Service Zones & Geofencing

800-CarWash operates on a strict spatial bounding architecture powered by **PostGIS**. Service availability, team allocation, and scheduling capacities are partitioned geographically.

---

## 1. Geographic Boundary Architecture

The platform models service areas in a two-tier spatial hierarchy:

```mermaid
graph TD
    EM["🏙️ Emirate Master City Zone (Dubai)"]
    
    subgraph Zones["Operational Sub-Zones"]
        Z1["📍 Sub-Zone: Downtown / Business Bay"]
        Z2["📍 Sub-Zone: Dubai Marina / JBR"]
        Z3["📍 Sub-Zone: Jumeirah / Umm Suqeim"]
        Z4["📍 Sub-Zone: Arabian Ranches / Hills"]
        Z5["📍 Sub-Zone: Deira / Bur Dubai"]
    end

    EM --> Z1
    EM --> Z2
    EM --> Z3
    EM --> Z4
    EM --> Z5
```

---

## 2. Spatial Geofencing Logic

When a user selects or drops a pin on the map picker in the Customer Mobile App, the latitude and longitude coordinates $(\text{Lat}, \text{Lng})$ are transmitted to the backend for an immediate Point-in-Polygon (PIP) evaluation.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 📱 Customer App
    participant API as ⚙️ Backend API
    participant DB as 🐘 PostgreSQL (PostGIS)

    Customer->>API: POST /api/v1/zones/check-location {lat: 25.1972, lng: 55.2744}
    API->>DB: SELECT id, name, is_active FROM sub_zones WHERE ST_Contains(geom, ST_SetSRID(ST_Point(55.2744, 25.1972), 4326)) AND is_active = TRUE
    
    alt Coordinate falls inside active sub-zone
        DB-->>API: Returns Sub-Zone Record (e.g., Downtown Dubai)
        API-->>Customer: 200 OK (is_serviced: true, zone: Downtown Dubai)
        Note over Customer: Customer proceeds to select time slot & confirm booking
    else Coordinate falls OUTSIDE all active polygons
        DB-->>API: Returns Empty Set (0 rows)
        API-->>Customer: 200 OK (is_serviced: false, message: Out of service area)
        Note over Customer: UI displays modal: Service Unavailable in this area
    end
```

---

## 3. Strict Out-of-Service Area Policy
- **Zero Booking Leakage**: If a customer selects a location outside Dubai's active polygon boundaries, the application **strictly blocks** the checkout flow.
- **Visual Feedback**: The map boundary is visually represented with an outline, and an alert banner informs the user: *"We do not service this location yet. Please select an address within our Dubai service zones."*

---

## 4. Sub-Zone Management & Fleet Clustering
Each sub-zone is an independent operational unit that governs:
1. **Specialist Team Allocation**: Specialists can be assigned to a primary sub-zone base to minimize travel times and traffic delays across Dubai.
2. **Hourly Capacity Limits**: Admin defines maximum concurrent bookings per time slot (e.g. max 5 simultaneous washes in *Dubai Marina* between 10:00–11:00 AM).
3. **Dynamic On-Demand Dispatch**: On-demand dispatch searches for specialists stationed or currently active within the specific sub-zone.
