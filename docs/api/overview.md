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

## 2. Authentication Headers
Endpoints requiring authentication must include the Bearer JWT token in the `Authorization` header:

```http
Authorization: Bearer <eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...>
```

---

## 3. Rate Limiting & HTTP Status Codes

| Status Code | Description | Standard Usage |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | Standard GET, PUT, PATCH updates. |
| `201 Created` | Resource created | Successful POST creation (Orders, Vehicles, Locations). |
| `400 Bad Request` | Validation failure | Invalid DTO payloads or missing parameters. |
| `401 Unauthorized` | Authentication failure | Missing, expired, or invalid JWT token. |
| `403 Forbidden` | Access denied | User lacks required RBAC role. |
| `404 Not Found` | Entity missing | Target order, vehicle, or zone does not exist. |
| `409 Conflict` | Business state conflict | Slot reached max capacity or duplicate record. |
| `429 Too Many Requests` | Rate limit breached | Exceeded standard API throttling. |
