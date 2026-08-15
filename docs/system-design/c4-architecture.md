# High-Level C4 Architecture

This section describes the high-level system architecture for the 800-CarWash platform utilizing the **C4 Model** (Context, Container, and Component diagrams).

---

## 1. C4 Level 1: System Context Diagram

The System Context diagram illustrates the boundary of the 800-CarWash ecosystem, its primary users, and external third-party integrations.

```mermaid
graph TD
    subgraph Users["Platform Users"]
        CUST["👤 Vehicle Owner (Customer)"]
        SPEC["🧑‍🔧 Detailing Specialist (Technician)"]
        ADMIN["👨‍💼 Ops & Super Admin (Staff)"]
    end

    subgraph Platform["800-CarWash Platform"]
        SYS["🚗 800-CarWash Core Ecosystem (API, Admin Web, Mobile Apps, Spatial Engine)"]
    end

    subgraph ExtSystems["External Systems"]
        FCM["🔔 Firebase Cloud Messaging (Push)"]
        SMS_GW["📱 SMS Gateway (Twilio/Infobip)"]
        MAIL_GW["📧 Email Service (SendGrid/SES)"]
        S3_STO["☁️ AWS S3 Storage (Photos)"]
        MAPS["🗺️ Google Maps API (Distance Matrix)"]
    end

    CUST -->|Books, Tracks, Rates| SYS
    SPEC -->|Receives Jobs, Streams GPS, Uploads Photos| SYS
    ADMIN -->|Dispatches, Manages Catalog & Zones| SYS

    SYS -->|Sends Push Notifications| FCM
    SYS -->|Sends SMS OTP| SMS_GW
    SYS -->|Delivers Invoices| MAIL_GW
    SYS -->|Stores Inspection Photos| S3_STO
    SYS -->|Calculates ETAs & Geocodes| MAPS
```

---

## 2. C4 Level 2: Container Diagram

The Container diagram zooms into the software containers that form the 800-CarWash system.

```mermaid
graph TD
    subgraph Clients["Client Containers"]
        C_APP["📱 Customer Mobile App (React Native)"]
        S_APP["📱 Specialist Mobile App (React Native)"]
        A_WEB["💻 Admin Web Portal (Next.js 16)"]
    end

    subgraph AppServers["Application Server Containers"]
        API_GW["⚙️ NestJS API Gateway & REST Server"]
        WS_GW["⚡ WebSocket Gateway (Socket.io)"]
        WORKER["🔄 Background Worker Engine (BullMQ)"]
    end

    subgraph DataStorage["Data & Storage Containers"]
        PG["🐘 PostgreSQL 17 + PostGIS 3.5"]
        REDIS["⚡ Redis 7.4 Cluster"]
        S3["☁️ AWS S3 Storage"]
    end

    C_APP -->|HTTPS / REST| API_GW
    C_APP -.->|WSS / Socket.io| WS_GW
    S_APP -->|HTTPS / REST| API_GW
    S_APP -.->|WSS / GPS Telemetry| WS_GW
    A_WEB -->|HTTPS / REST| API_GW
    A_WEB -.->|WSS / Live Map Board| WS_GW

    API_GW --> PG
    API_GW --> REDIS
    API_GW --> S3
    WS_GW --> REDIS
    WORKER --> PG
    WORKER --> REDIS
```

---

## 3. C4 Level 3: Component Diagram (Backend Core)

Inside the **NestJS Backend Core**, modular micro-domains encapsulate business capabilities:

```mermaid
graph LR
    subgraph CoreArch["NestJS Core Architecture"]
        AUTH["🔐 AuthModule (JWT & Roles)"]
        ZONE["🗺️ ZoneModule (PostGIS PIP)"]
        CAT["🏷️ CatalogModule (Services & Pricing)"]
        ORD["📦 OrderModule (Multi-car Lifecycle)"]
        DISP["📡 DispatchModule (Direct & Realtime)"]
        SUB["🔄 SubscriptionModule (Cron Plans)"]
        PROMO["🎟️ PromotionModule (Promos & Loyalty)"]
        MEDIA["📷 MediaModule (S3 Pre-signed URLs)"]
    end

    AUTH --> ORD
    ZONE --> ORD
    CAT --> ORD
    ORD --> DISP
    ORD --> MEDIA
    SUB --> ORD
    PROMO --> ORD
```
