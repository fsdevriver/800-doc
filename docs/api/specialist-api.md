# Specialist REST API Specification

This document defines the REST endpoints consumed by the **Specialist Mobile App**.

---

## 1. Authentication & Shift Management

### `POST /api/v1/auth/specialist/login`
Specialist login via admin-provisioned credentials.
```json
// Request Body
{
  "email": "specialist.ahmed@800carwash.ae",
  "password": "SecurePassword123!"
}
```

### `PATCH /api/v1/specialist/status`
Updates current shift state.
```json
// Request Body
{
  "operational_status": "AVAILABLE" // AVAILABLE, ON_BREAK, SICK, OFFLINE
}
```

---

## 2. Order Execution Lifecycle

### `GET /api/v1/specialist/orders/active`
Fetches currently assigned order details, vehicle list, and customer parking instructions.

### `POST /api/v1/specialist/orders/{id}/acknowledge`
Specialist confirms review and comprehension of job instructions (gate codes, car count, location). Emits real-time WebSocket event `order:acknowledged` to Admin Operations console.
```json
// Response: 200 OK
{
  "success": true,
  "data": {
    "order_id": "8f3b2c1a-5d4e-4f6a-9b8c-1e2d3f4a5b6c",
    "status": "ACKNOWLEDGED",
    "acknowledged_at": "2026-08-16T08:15:30.000Z",
    "message": "Order acknowledged successfully. Admin notified."
  }
}
```

### `POST /api/v1/specialist/orders/{id}/start-journey`
Transitions order to `EN_ROUTE` and initiates background GPS telemetry.

### `POST /api/v1/specialist/orders/{id}/arrive`
Transitions order to `ARRIVED` upon reaching customer coordinates.

### `POST /api/v1/specialist/orders/{id}/cancel-request`
Specialist requests order cancellation on-site due to physical field constraints (locked gate, customer unreachable after grace period, severe weather).
- **Enforced Guardrail**: Can **ONLY** be executed when `order.status === 'ARRIVED'`. Calls made during `ASSIGNED`, `ACKNOWLEDGED`, or `EN_ROUTE` will be rejected with `400 Bad Request`.
- Requires a non-empty `cancellation_reason` message.
- Triggers high-priority WebSocket alert `admin:order:cancellation_requested` to Admin Ops Console for review.
```json
// Request Body
{
  "cancellation_reason": "Basement security gate locked; customer phone unreachable for 10 minutes."
}

// Response: 200 OK
{
  "success": true,
  "data": {
    "order_id": "8f3b2c1a-5d4e-4f6a-9b8c-1e2d3f4a5b6c",
    "status": "CANCELLATION_REQUESTED",
    "cancellation_reason": "Basement security gate locked; customer phone unreachable for 10 minutes.",
    "requested_at": "2026-08-16T08:35:10.000Z",
    "message": "Cancellation request submitted. Awaiting Admin approval."
  }
}
```

---

## 3. Vehicle Quality Inspection & Photos (Future Version)

> [!NOTE]
> Photo upload endpoints are reserved for a future version release and are disabled in the initial production release.

### `POST /api/v1/media/presign-upload`
Generates signed S3 URLs for direct photo uploads.
```json
// Request Body
{
  "order_id": "8f3b2c1a-5d4e-4f6a-9b8c-1e2d3f4a5b6c",
  "order_item_id": "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
  "photo_phase": "BEFORE", // or "AFTER"
  "photo_count": 4,
  "content_type": "image/jpeg"
}

// Response: 200 OK
{
  "success": true,
  "data": {
    "upload_slots": [
      {
        "angle": "FRONT",
        "s3_key": "orders/8f3b/items/9a8b/before_front.jpg",
        "presigned_put_url": "https://s3.eu-central-1.amazonaws.com/800carwash-media-prod/orders/8f3b/items/9a8b/before_front.jpg?X-Amz-Signature=..."
      },
      {
        "angle": "REAR",
        "s3_key": "orders/8f3b/items/9a8b/before_rear.jpg",
        "presigned_put_url": "https://s3.eu-central-1.amazonaws.com/800carwash-media-prod/orders/8f3b/items/9a8b/before_rear.jpg?X-Amz-Signature=..."
      },
      {
        "angle": "LEFT_SIDE",
        "s3_key": "orders/8f3b/items/9a8b/before_left.jpg",
        "presigned_put_url": "https://s3.eu-central-1.amazonaws.com/800carwash-media-prod/orders/8f3b/items/9a8b/before_left.jpg?X-Amz-Signature=..."
      },
      {
        "angle": "RIGHT_SIDE",
        "s3_key": "orders/8f3b/items/9a8b/before_right.jpg",
        "presigned_put_url": "https://s3.eu-central-1.amazonaws.com/800carwash-media-prod/orders/8f3b/items/9a8b/before_right.jpg?X-Amz-Signature=..."
      }
    ]
  }
}
```

### `POST /api/v1/specialist/orders/{id}/items/{item_id}/start-wash`
Unlocks washing after verifying Before Photos upload.

### `POST /api/v1/specialist/orders/{id}/items/{item_id}/complete-wash`
Completes vehicle after verifying After Photos upload.

---

## 4. On-Site Upselling & Payment Collection

### `POST /api/v1/specialist/orders/{id}/items/{item_id}/add-ons`
Appends extra on-site detailing services, triggering customer approval sheet.

### `POST /api/v1/specialist/orders/{id}/collect-payment`
Records settlement.
```json
// Request Body
{
  "payment_method": "POS_CARD", // or "COD"
  "amount_collected": 150.00,
  "terminal_reference": "POS-TXN-8849201" // Optional
}
```
