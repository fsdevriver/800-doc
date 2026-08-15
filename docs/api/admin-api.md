# Admin Operations REST API Specification

This document details the REST API endpoints powering the **Admin Operations Web Portal (Next.js 16)**.

---

## 1. Direct Dispatch & Fleet Management

### `GET /api/v1/admin/dispatch/live-map`
Fetches all active specialist locations, status, and pending unassigned orders across Dubai.

### `POST /api/v1/admin/dispatch/assign-order`
Directly assigns an order to a specific specialist.
```json
// Request Body
{
  "order_id": "8f3b2c1a-5d4e-4f6a-9b8c-1e2d3f4a5b6c",
  "specialist_id": "7a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d"
}
```

### `POST /api/v1/admin/dispatch/reassign-order`
Reassigns an order to a secondary technician in case of emergency.

---

## 2. Geofence & Sub-Zone Management

### `POST /api/v1/admin/zones/sub-zones`
Creates or updates a sub-zone polygon.
```json
// Request Body
{
  "service_zone_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "name": "Dubai Marina & JBR",
  "code": "DXB-MARINA",
  "polygon_geojson": {
    "type": "Polygon",
    "coordinates": [
      [
        [55.1324, 25.0781],
        [55.1512, 25.0894],
        [55.1435, 25.0672],
        [55.1324, 25.0781]
      ]
    ]
  },
  "is_active": true
}
```

---

## 3. Catalog & Price Matrix Configuration

### `POST /api/v1/admin/catalog/services`
Creates a core detailing service package.

### `PUT /api/v1/admin/catalog/pricing-matrix`
Updates price rates for services across all vehicle types (Sedan, SUV, Luxury, Van).

### `POST /api/v1/admin/catalog/addon-groups`
Creates modular add-on groups with min/max selection validation rules.

---

## 4. Slot Capacity & Growth Management

### `PUT /api/v1/admin/schedules/sub-zones/{id}/capacities`
Updates hourly slot limits for a specific sub-zone.

### `POST /api/v1/admin/marketing/promo-codes`
Generates targeted promotional discount codes.
