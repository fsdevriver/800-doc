# Subscriptions Module

The 800-CarWash subscription engine delivers predictable recurring revenue by enabling customers to automate their vehicle cleaning routines.

---

## 1. Subscription Frequencies & Packages

Admin can create and publish customizable subscription packages:

| Frequency | Target Customer Use Case | Typical Billing Cycle | Discount Tier |
| :--- | :--- | :--- | :---: |
| **Weekly Care** | Daily commuters, luxury car owners, executives | Billed every 4 weeks (4 washes) | 20% Off Standard Rates |
| **Bi-Weekly Care** | Standard family vehicles, weekend drivers | Billed every 4 weeks (2 washes) | 15% Off Standard Rates |
| **Monthly Routine** | Low-mileage vehicles, occasional drivers | Billed monthly (1 wash) | 10% Off Standard Rates |

---

## 2. Subscription Configuration Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 👤 Customer
    participant App as 📱 Customer Mobile App
    participant API as ⚙️ Backend Core
    participant DB as 🐘 PostgreSQL / Cron Engine

    Customer->>App: 1. Chooses "Subscriptions" tab
    Customer->>App: 2. Selects Frequency (e.g., Weekly Plan)
    Customer->>App: 3. Selects Car(s) & Service Package
    Customer->>App: 4. Chooses Preferred Recurring Day & Time Slot (e.g. Every Saturday at 10:00 AM)
    Customer->>App: 5. Selects Saved Location (e.g. Home Villa)
    Customer->>App: 6. Selects Payment Method (Cash / POS on delivery per wash)
    App->>API: POST /api/v1/subscriptions
    API->>DB: Save Subscription & Generate Scheduled Occurrences
    API-->>App: 201 Created (Subscription Active)
```

---

## 3. Automated Order Generation Lifecycle

The platform uses a background scheduler (BullMQ cron worker) to instantiate live orders ahead of time:

```mermaid
graph TD
    CRON["⏰ Nightly Recurring Worker (Daily at 00:00 UTC)"]
    
    SUB_REC["🔍 Scans Active Subscriptions Due in Next 24 Hours"]
    
    GEN_ORD["📦 Automatically Generates Order (Status: ORDER_CREATED)"]
    
    DISP["👨‍💼 Pushes to Ops Dispatch Board for Specialist Assignment"]

    CRON --> SUB_REC
    SUB_REC --> GEN_ORD
    GEN_ORD --> DISP
```

---

## 4. Subscription Management Features
- **Pause & Resume**: Customer can pause their recurring schedule during vacations or travel periods.
- **Skip Wash**: Customer can skip an upcoming scheduled session at least 12 hours prior without penalty.
- **Location / Slot Change**: Customer can modify their recurring delivery window or parking spot via the app.
