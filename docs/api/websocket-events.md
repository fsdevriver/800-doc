# WebSocket Gateway & Real-Time Event Protocol

This document provides the technical contract, packet payloads, and room subscription lifecycle for real-time WebSocket communication in 800-CarWash.

---

## 1. Gateway Connection & Authentication

- **Endpoint**: `wss://api.800carwash.ae/socket.io`
- **Transport**: `websocket` (fallback to `polling` disabled for maximum performance).
- **Authentication**: JWT token sent during connection handshake:

```typescript
import { io, Socket } from "socket.io-client";

const socket: Socket = io("https://api.800carwash.ae", {
  auth: {
    token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000
});
```

---

## 2. Complete Event Contract Matrix

### Specialist $\rightarrow$ Server Events
| Event Name | Direction | Payload Schema | Description |
| :--- | :---: | :--- | :--- |
| `specialist:location:update` | Client $\rightarrow$ Server | `{ order_id: string, lat: number, lng: number, heading: number, speed_kmh: number }` | Emitted every 5–10s when status is `EN_ROUTE`. |
| `specialist:status:change` | Client $\rightarrow$ Server | `{ operational_status: "AVAILABLE" \| "ON_BREAK" \| "SICK" \| "OFFLINE" }` | Updates specialist availability on Admin board. |
| `specialist:upsell:propose` | Client $\rightarrow$ Server | `{ order_id: string, item_id: string, addon_option_id: string, price: number }` | Triggers customer approval modal. |

---

### Server $\rightarrow$ Customer Events
| Event Name | Direction | Payload Schema | Description |
| :--- | :---: | :--- | :--- |
| `order:tracking:location` | Server $\rightarrow$ Client | `{ lat: number, lng: number, heading: number, eta_minutes: number }` | Live GPS stream for customer map animation. |
| `order:status:updated` | Server $\rightarrow$ Client | `{ order_id: string, status: string, timestamp: string }` | Pushed on status change (`EN_ROUTE`, `ARRIVED`, etc.). |
| `order:item:progress` | Server $\rightarrow$ Client | `{ item_id: string, vehicle_name: string, status: "WASHING" \| "COMPLETED" }` | Per-car progress in multi-car orders. |
| `order:upsell:requested` | Server $\rightarrow$ Client | `{ item_id: string, addon_title: string, price_delta: number }` | Prompts customer to approve on-site add-on. |
| `order:grace_period:started`| Server $\rightarrow$ Client | `{ order_id: string, remaining_seconds: number, reason: string }` | 10-minute timer if car is locked/unreachable. |

---

### Server $\rightarrow$ Admin Ops Events
| Event Name | Direction | Payload Schema | Description |
| :--- | :---: | :--- | :--- |
| `admin:fleet:location_stream`| Server $\rightarrow$ Client | `Array<{ specialist_id: string, lat: number, lng: number, status: string }>` | Master fleet stream for Dubai Live Dispatch Board. |
| `admin:order:new_created` | Server $\rightarrow$ Client | `{ order_id: string, order_type: string, sub_zone_id: string, total: number }` | Triggers visual & sound alert on Dispatch Console. |
| `admin:order:acknowledged` | Server $\rightarrow$ Client | `{ order_id: string, specialist_id: string, acknowledged_at: string }` | Notifies Ops dispatcher that specialist reviewed & accepted instructions. |
| `admin:order:cancellation_requested` | Server $\rightarrow$ Client | `{ order_id: string, specialist_id: string, reason: string, requested_at: string }` | Audible & modal alert on Admin console requiring dispatcher approval. |
| `admin:order:exception` | Server $\rightarrow$ Client | `{ order_id: string, exception_type: "NO_SHOW" \| "VEHICLE_BREAKDOWN" }` | Urgent dispatcher alert for reassignment. |

---

### Two-Way In-App Chat Events
| Event Name | Direction | Payload Schema | Description |
| :--- | :---: | :--- | :--- |
| `chat:message:send` | Client $\rightarrow$ Server | `{ order_id: string, recipient_id: string, text: string }` | Customer or Specialist sends gate instructions/note. |
| `chat:message:receive` | Server $\rightarrow$ Client | `{ message_id: string, sender_name: string, text: string, timestamp: string }` | Pushed immediately to target user's active chat window. |
