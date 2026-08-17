# Real-Time Telemetry & Communication Architecture

Real-time communication in 800-CarWash powers live specialist GPS tracking, instant status synchronizations, on-site upsell approvals, in-app messaging/chat, and background push notifications.

---

## 1. High-Level Real-Time Topology

```mermaid
graph TD
    subgraph Clients["Clients"]
        CA["📱 Customer Mobile App (React Native)"]
        SA["📱 Specialist Mobile App (React Native)"]
        AP["💻 Admin Ops Live Board (Next.js 16)"]
    end

    subgraph GatewayCluster["Real-Time Gateway Cluster"]
        WS1["⚡ NestJS WebSocket Gateway (Node 1)"]
        WS2["⚡ NestJS WebSocket Gateway (Node 2)"]
    end

    subgraph PubSubCluster["Pub/Sub & Geospatial In-Memory State"]
        REDIS_PUB["⚡ Redis Pub/Sub Message Bus"]
        REDIS_GEO["📍 Redis Geospatial Cache (specialists:active)"]
    end

    subgraph OutOfBand["Out-of-Band Real-Time Hub"]
        NOVU["🔔 Novu Engine (Self-Hosted Push & In-App Alerts)"]
        SMS["📱 SMS Gateway (Twilio / Infobip)"]
    end

    CA --- WS1
    SA --- WS2
    AP --- WS1

    WS1 --- REDIS_PUB
    WS2 --- REDIS_PUB
    WS1 --- REDIS_GEO
    WS2 --- REDIS_GEO

    WS1 --> NOVU
    WS2 --> SMS
```

---

## 2. Real-Time Live Map Tracking Workflow

When a specialist taps **"Start Journey"** in the Specialist App, the live tracking pipeline activates:

```mermaid
sequenceDiagram
    autonumber
    actor Spec as 🧑‍🔧 Specialist App (React Native)
    participant WS as ⚡ NestJS WebSocket Gateway
    participant Redis as ⚡ Redis (Pub/Sub & GeoSet)
    participant MapsAPI as 🗺️ Google Maps Distance Matrix
    actor Cust as 📱 Customer App (React Native Map)
    actor Ops as 💻 Admin Live Map (Next.js 16 Web)

    Note over Spec: Specialist taps "Start Journey" (Status: EN_ROUTE)
    Spec->>WS: Emit "specialist:journey:start" {order_id, specialist_id}
    WS->>Redis: Set specialist state -> EN_ROUTE
    WS-->>Cust: Event "order:status:updated" (Status: EN_ROUTE)
    WS-->>Cust: Push Notification: "Your specialist is on the way!"
    
    loop Background GPS Streaming (Every 5–10 Seconds)
        Spec->>WS: Emit "specialist:location:update" (lat, lng, heading, speed)
        WS->>Redis: GEOADD specialists:active lng lat specialist_id
        WS->>Redis: PUBLISH room:order:{order_id} (lat, lng, heading)
        WS->>Redis: PUBLISH room:fleet:dubai (specialist_id, lat, lng)
        
        Redis-->>Cust: Socket Event: "order:tracking:location" (Live Coordinates)
        Redis-->>Ops: Socket Event: "admin:fleet:location_stream" (Live Coordinates)
    end
```

---

## 3. Client Map Rendering & Animation Strategies

### A. Customer Mobile App (`react-native-maps`)
1. **Marker Position Interpolation**: Rather than jumping abruptly, the specialist car icon uses `AnimatedRegion` / linear coordinate interpolation to animate smoothly over 5–10 second update intervals.
2. **Bearing & Rotation**: The car marker rotates smoothly based on the `heading` attribute (0°–360°) to reflect the technician vehicle's actual driving direction.
3. **Route Polyline**: Draws a route polyline between the specialist's current location and the customer's vehicle pin using Google Directions API.
4. **Dynamic ETA Badge**: Shows dynamic arrival time (e.g. `Arriving in ~12 mins`).

### B. Admin Web Portal (`Next.js 16` + Vector Maps)
1. **Dubai Master Fleet Map**: Interactive Mapbox GL JS / Google Maps Canvas rendering all active specialists across all Dubai sub-zones simultaneously.
2. **Color-Coded Status Pulsing**:
   - 🔵 **Blue Vehicle Pin**: `EN_ROUTE` to a customer.
   - 🟠 **Orange Vehicle Pin**: Currently `WASHING` on-site.
   - 🟢 **Green Vehicle Pin**: `AVAILABLE` for dispatch.
3. **Breadcrumb Trail & Telemetry Inspection**: Ops dispatchers can click any specialist pin to view live speed, heading, battery/device status, and assigned order trail.

| Channel / Room Pattern | Target Subscribers | Broadcast Events |
| :--- | :--- | :--- |
| `room:order:{order_id}` | Assigned Customer & Specialist | Live specialist GPS, order status transitions (`EN_ROUTE`, `ARRIVED`, `WASHING`, `COMPLETED`), per-car wash progress, on-site upsell requests, in-app chat. |
| `room:fleet:dubai` | Ops Dispatchers (Admin Portal) | Real-time coordinates of all on-duty specialists across Dubai sub-zones, shift changes. |
| `room:subzone:{subzone_id}`| Ops Dispatchers & Local Fleet | New incoming unassigned orders, slot capacity saturation alerts. |
| `user:specialist:{id}` | Specific Specialist | Direct dispatch assignment push, order cancellation alerts. |
| `user:customer:{id}` | Specific Customer | Account alerts, payment confirmations, loyalty bonus awarded. |

---

## 4. In-App Real-Time Communication Use Cases

### A. Real-Time Order Modification (On-Site Upsell)
When a customer requests an extra detailing service on-site:
1. Specialist selects add-on in app $\rightarrow$ Emits `order:upsell:requested`.
2. Customer app instantly opens a confirmation bottom-sheet with price difference.
3. Customer taps "Accept" $\rightarrow$ Emits `order:upsell:accepted`.
4. Invoice and specialist app reflect the updated order total in real time.

### C. Live No-Show Grace Period Countdown
- If a vehicle is locked, specialist taps "Report Inaccessible" $\rightarrow$ A synchronized 10-minute countdown timer broadcasts to both Customer App and Admin Dashboard via WebSockets.

---

## 5. Specialist Heartbeat & Staleness Failover Engine

To prevent orders from getting trapped in limbo when a specialist's phone runs out of battery, crashes, or loses cellular connectivity, 800-CarWash implements a **Redis TTL Heartbeat Watchdog**:

```mermaid
sequenceDiagram
    autonumber
    actor Spec as 🧑‍🔧 Specialist App
    participant WS as ⚡ WebSocket Gateway
    participant Redis as ⚡ Redis State Store
    participant Watchdog as 🐕 BullMQ Watchdog Worker (Every 30s)
    actor Ops as 💻 Admin Live Ops Board

    loop Every 15 Seconds
        Spec->>WS: Emit "specialist:heartbeat" {specialist_id, battery_pct, network_type}
        WS->>Redis: SETEX specialist:{id}:heartbeat 45 "ONLINE"
    end

    Note over Spec: Phone battery dies / App crashes during "EN_ROUTE"
    Note over Redis: 45 seconds pass -> Key specialist:{id}:heartbeat EXPIRES

    Watchdog->>Redis: Scan active specialists with active jobs
    Watchdog->>Redis: Check EXISTS specialist:{id}:heartbeat
    Note over Watchdog: Key is missing! Specialist has gone unresponsive
    Watchdog->>WS: Emit "specialist:stale:alert" {specialist_id, order_id, last_known_gps}
    WS-->>Ops: Flag specialist as "UNRESPONSIVE (STALE)" on Live Board
    Ops->>Ops: Reassign order with 1-Click to nearest available technician
```

### Staleness State Transitions:
- `AVAILABLE` + Heartbeat Missing ➔ Auto-marked `OFFLINE`.
- `EN_ROUTE` / `WASHING` + Heartbeat Missing for > 45s ➔ Marked `UNRESPONSIVE (STALE)` with immediate Admin alert.
- Specialist reconnects ➔ Automatically clears `STALE` flag and resyncs active order state machine.

---

## 6. Offline-First Underground & Basement Parking Telemetry

In high-density Dubai districts (Downtown, DIFC, Marina, Business Bay), underground basement parking lots (P1 to B4) frequently experience total cellular blackouts. The Specialist Mobile App is built with an **Offline-First Synchronous Store & Forward Queue**:

```mermaid
graph LR
    subgraph SpecialistApp["Specialist Mobile App (Basement P3)"]
        ACTION["Specialist Taps 'Start Wash' or 'Complete Wash'"]
        LOCAL_DB["💾 Local SQLite / WatermelonDB Queue"]
        NET_MON["📡 Network Connectivity Monitor (NetInfo)"]
    end

    subgraph CloudSync["Backend Gateway (When Online)"]
        API["⚙️ NestJS Ingestion Gateway"]
        DB["🐘 PostgreSQL 17 Master"]
    end

    ACTION -->|1. Offline Write| LOCAL_DB
    NET_MON -->|2. Detects 4G/5G Network Restored| LOCAL_DB
    LOCAL_DB -->|3. Flushes Idempotent Event Queue with Device Timestamps| API
    API -->|4. Reconciles State| DB
```

1. **Trusted Device Timestamping**: Every offline action generates an immutable ISO timestamp and cryptographic UUID locally.
2. **Deterministic Order Reconciliation**: When the technician exits the basement parking structure and reconnects to 4G/5G, the app flushes pending actions in chronological order with idempotent headers.

---

## 6. Multi-Channel WhatsApp & Novu Notification Strategy

Given UAE customer communication preferences where **WhatsApp open rates exceed 95%**, Novu orchestrates automated multi-channel messaging:

| Event Trigger | Primary Channel | Fallback Channel | Payload / Template |
| :--- | :--- | :--- | :--- |
| **Specialist En-Route** | 💬 **WhatsApp Notification** | 🔔 Push Notification | *"Your 800-CarWash specialist Ahmed is on the way! Track live: https://800carwash.ae/t/800-092"* |
| **Specialist Arrived** | 💬 **WhatsApp Notification** | 🔔 Push Notification | *"Specialist has arrived at your villa/parking spot."* |
| **Service Completed** | 💬 **WhatsApp Notification** | ✉️ Transactional Email | *"Your vehicle detailing is complete! View inspection & PDF Tax Invoice attached."* |
| **Auth Verification OTP** | 📱 **SMS Gateway** | 💬 WhatsApp OTP | *"Your 800-CarWash login code is 849201. Valid for 5 minutes."* |
