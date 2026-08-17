# API Architecture & Protocols

The 800-CarWash API is architected around RESTful HTTP/2 standards and bidirectional WebSocket protocols.

---

## 1. Global API Conventions

### Base URL Structure
- **Production API**: `https://api.800carwash.ae/api/v1`
- **Staging API**: `https://staging-api.800carwash.ae/api/v1`
- **WebSocket Gateway**: `wss://api.800carwash.ae/socket.io`

### Standard Response Envelope
All REST API responses return a standardized JSON structure:

```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "message": "Operation completed successfully",
  "meta": {
    "timestamp": "2026-08-15T18:00:00.000Z",
    "requestId": "req_8fa9102c4b81"
  }
}
```

### Standard Error Envelope
```json
{
  "success": false,
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Selected vehicle model does not match the active sub-zone capacity",
  "details": [
    {
      "field": "scheduled_start_time",
      "issue": "Capacity for 10:00 AM slot in Downtown Dubai is fully booked"
    }
  ],
  "meta": {
    "timestamp": "2026-08-15T18:00:00.000Z",
    "requestId": "req_8fa9102c4b81"
  }
}
```

---

## 2. Authentication & Security Headers
Endpoints requiring authentication must include the Bearer JWT token in the `Authorization` header:

```http
Authorization: Bearer <eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...>
```

### Mutating Endpoints: Idempotency-Key Header
All mutating endpoints (`POST`, `PUT`, `PATCH` for orders, payments, status transitions, and tips) require a unique client-generated UUID in the `Idempotency-Key` header per [ADR-007](file:///Users/hhasan/Desktop/800/documentation/docs/adr/ADR-007-idempotency-fault-tolerance.md):

```http
Idempotency-Key: 018d3f1a-9b4e-7a2c-8f1e-3c2d1a4b5e6f
```

- If an identical request is received while the first is in progress, the API responds with `409 Conflict`.
- If the request has already been executed successfully within the last 24 hours, the API returns the cached response with `X-Cache: IDEMPOTENT-HIT` without re-executing business logic.

---

## 3. Tiered Rate Limiting & Throttling Policies

The API enforces Redis-backed sliding-window rate limiting differentiated by client tier and endpoint criticality:

| Route Group | Rate Limit Window | Max Requests | Target Clients | Action on Limit Exceeded |
| :--- | :--- | :--- | :--- | :--- |
| **Auth / OTP Dispatch** (`/auth/otp/send`) | 60 seconds | **3 req** | Customer Apps | `429 Too Many Requests` (Prevents SMS drain) |
| **Order Checkout & Booking** (`/orders`) | 60 seconds | **10 req** | Customer Apps | `429 Too Many Requests` (Prevents slot hoarding) |
| **Public Catalog & Spatial Check** | 60 seconds | **120 req** | Customer Apps / Web | `429` with `Retry-After: <seconds>` |
| **Specialist GPS Telemetry** (`/telemetry`) | 60 seconds | **30 req** | Specialist Mobile Apps | Silently drops stale pings |
| **Admin Operations Portal** (`/admin/*`) | 60 seconds | **600 req** | Operations Web Portal | High quota for real-time dispatch dashboard |

---

## 4. HTTP Status Codes & Error Catalog

| Status Code | Description | Standard Usage |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | Standard GET, PUT, PATCH updates. |
| `201 Created` | Resource created | Successful POST creation (Orders, Vehicles, Locations). |
| `202 Accepted` | Async action queued | Photo ingestion and async background jobs. |
| `400 Bad Request` | Validation failure | Invalid DTO payloads or missing parameters. |
| `401 Unauthorized` | Authentication failure | Missing, expired, or invalid JWT token. |
| `403 Forbidden` | Access denied | User lacks required RBAC role. |
| `404 Not Found` | Entity missing | Target order, vehicle, or zone does not exist. |
| `409 Conflict` | State conflict / Lock | Request currently in flight or duplicate idempotent request. |
| `429 Too Many Requests` | Rate limit breached | Exceeded sliding-window rate limits. |
| `503 Service Unavailable` | Circuit breaker tripped | Downstream third-party service temporarily isolated. |

