# Ordering & Scheduling Engine

800-CarWash provides three distinct ordering mechanisms to cater to both immediate and planned detailing needs.

---

## 1. The Three Order Fulfillment Modes

```mermaid
graph TD
    OM["🚗 Order Modes"] --> OD["⚡ 1. On-Demand Wash"]
    OM --> SCH["📅 2. Scheduled Time Slot"]
    OM --> SUB["🔄 3. Recurring Subscription"]

    OD --> OD_EXEC["Immediate Dispatch or Dynamic ETA"]
    SCH --> SCH_EXEC["Exact Start-Time Selection (Slot Capacity)"]
    SUB --> SUB_EXEC["Weekly / Bi-Weekly / Monthly Automated"]
```

---

## 2. On-Demand Booking Flow

On-Demand orders are designed for instant doorstep fulfillment:

1. **Specialist Availability Check**:
    - If specialists in the sub-zone are in `AVAILABLE` state, the order displays an estimated arrival time of **20–30 minutes**.
    - If all specialists in the zone are currently `WASHING` or `EN_ROUTE`, the system calculates a dynamic ETA based on when the earliest job completes + travel time (e.g. ~45–60 mins).
2. **Order Placement**: Order transitions immediately to `ORDER_CREATED` $\rightarrow$ `ASSIGNING_SPECIALIST`.
3. **Dispatch Notification**: Admin Ops team receives an alert to assign the order directly to a specialist.

---

## 3. Scheduled Start-Time Slots

Scheduled bookings allow customers to plan ahead with precision:

- **Slot Granularity**: Configured by Admin with exact start times (e.g., `08:00 AM`, `09:00 AM`, `10:00 AM`, ..., `08:00 PM`).
- **Slot Capacity Management**:
    - Each sub-zone has an Admin-configured capacity per slot (e.g., `capacity = 4`).
    - When 4 bookings are confirmed for `10:00 AM` in *Downtown Dubai*, that specific slot is marked `SOLD_OUT` and disabled in the customer app.
- **Booking Window**: Customers can schedule up to 7 days in advance.

---

## 4. End-to-End Customer Booking Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 👤 Customer
    participant App as 📱 Customer Mobile App
    participant API as ⚙️ Backend Core
    participant DB as 🐘 PostgreSQL / Redis

    Customer->>App: 1. Selects Service & Add-ons
    Customer->>App: 2. Attaches Vehicle(s) (e.g., Sedan, SUV)
    Customer->>App: 3. Chooses Time Mode (On-Demand vs. Scheduled Slot)
    Customer->>App: 4. Selects / Drops Pin for Location
    App->>API: POST /api/v1/zones/check-location
    API-->>App: 200 OK (Zone: Marina, is_serviced: true)
    
    Customer->>App: 5. Selects Payment Method (COD / On-site POS)
    Customer->>App: 6. Applies Promo Code / Redeems Loyalty Points
    App->>API: POST /api/v1/orders/checkout
    API->>DB: Check slot capacity & lock slot
    API->>DB: Insert Order & OrderItems
    API-->>App: 201 Created (Order Ref: #800-98421)
    App-->>Customer: Shows Order Confirmation & Finding Specialist Screen
```

---

## 5. Order State Lifecycle

```mermaid
graph TD
    OC["1. ORDER_CREATED<br/>(Customer places order)"] --> AS["2. ASSIGNED<br/>(Admin assigns Specialist)"]
    AS --> ER["3. EN_ROUTE<br/>(Specialist starts journey / GPS streaming)"]
    ER --> AR["4. ARRIVED<br/>(Specialist arrives at car location)"]
    AR --> WS["5. WASHING<br/>(Before Photos uploaded & wash started)"]
    WS --> PP["6. PAYMENT_PENDING<br/>(After Photos uploaded & wash completed)"]
    PP --> CP["7. COMPLETED<br/>(Cash / POS recorded, invoice emailed)"]

    AS -->|Customer Cancels| CC["CANCELLED_BY_CUSTOMER<br/>(0% Fee)"]
    AR -->|Specialist Requests Cancel| CR["CANCELLATION_REQUESTED<br/>(Admin Alerted with Reason)"]
    CR -->|Admin Approves| CS["CANCELLED_BY_SPECIALIST<br/>(0% Fee / Specialist Available)"]
```
