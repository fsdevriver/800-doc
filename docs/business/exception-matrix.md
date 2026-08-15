# Operational Exceptions & Penalty Matrix

In a mobile on-demand detailing operation, physical field anomalies (locked gates, inaccessible underground parking, vehicle breakdowns, customer delays) are standard occurrences. 

800-CarWash establishes deterministic protocols and system state transitions to handle these exceptions.

---

## 1. Exception Handling Matrix

| Operational Scenario | Initiated By | System Trigger / Action | Customer Impact | Specialist & Ops Action |
| :--- | :--- | :--- | :--- | :--- |
| **Pre-Journey Cancellation** | Customer | Order status $\rightarrow$ `CANCELLED_BY_CUSTOMER`. | Full cancellation. **0% Penalty**. | Specialist freed back to `AVAILABLE`. |
| **En-Route Cancellation** | Customer | Order status $\rightarrow$ `CANCELLED_WITH_PENALTY`. | **Cancellation Penalty Flag** recorded on user profile. | Specialist compensated for travel time; freed to `AVAILABLE`. |
| **Vehicle Inaccessible / Locked** | Specialist | Specialist taps "Vehicle Inaccessible / Customer Unreachable". | Automated 3-minute waiting timer + SMS/automated call trigger. | Specialist waits 10 minutes. If no access, Ops transitions to `CANCELLED_NO_SHOW`. |
| **Customer No-Show (Post 10m)** | Ops / Specialist | Order status $\rightarrow$ `CANCELLED_NO_SHOW`. | Penalty fee flagged against customer account. | Specialist departs; order closed. |
| **Technician Vehicle Breakdown** | Specialist | Specialist flags emergency: "Vehicle Issue". Order $\rightarrow$ `DISPATCH_ISSUE`. | Push notification offering immediate reassignment or reschedule. | Ops dashboard sounds audible alarm; 1-click reassignment to nearest technician. |
| **On-Site Service Upsell** | Customer / Specialist | Specialist adds line items $\rightarrow$ `AWAITING_CUSTOMER_CONFIRMATION`. | Real-time modal appears on customer app with price delta. | Specialist cannot start extra service until customer taps "Accept". |

---

## 2. Inaccessible Vehicle & No-Show Protocol Flow

```mermaid
sequenceDiagram
    autonumber
    actor Spec as 🧑‍🔧 Specialist
    actor Cust as 👤 Customer
    participant App as 📱 Specialist App
    participant API as ⚙️ Backend Core
    participant Ops as 👨‍💼 Ops Dashboard

    Note over Spec: Arrives at location, car is locked or behind private security gate
    Spec->>App: Taps "Report Inaccessible / Locked"
    App->>API: POST /api/v1/specialist/orders/{id}/report-issue {reason: "LOCKED_GATE"}
    API->>API: Starts 10-minute Grace Period Countdown
    API-->>Cust: High-Priority Push & SMS: "Specialist is at your car. Please unlock vehicle."
    
    alt Customer arrives within 10 minutes
        Cust->>Spec: Unlocks vehicle
        Spec->>App: Taps "Issue Resolved -> Start Inspection"
        App->>API: POST /api/v1/orders/{id}/resume
    else 10-minute Timer Expires without response
        API->>Ops: Alerts Ops Dispatcher: "No-Show Timeout Exceeded"
        Ops->>API: POST /api/v1/admin/orders/{id}/cancel-no-show
        API->>API: Flags Penalty Debit on Customer Account
        API-->>Cust: Notification: "Order cancelled due to no-show"
        API-->>Spec: "Job closed. You are now available for new orders."
    end
```

---

## 3. On-Site Upselling Authorization Flow

```mermaid
sequenceDiagram
    autonumber
    actor Cust as 👤 Customer
    actor Spec as 🧑‍🔧 Specialist
    participant S_App as 📱 Specialist App
    participant API as ⚙️ Backend Core
    participant C_App as 📱 Customer App

    Cust->>Spec: "Can you also do engine bay detailing & rim wax?"
    Spec->>S_App: Opens "Add Service", selects Engine Clean (+50 AED) & Rim Wax (+25 AED)
    S_App->>API: POST /api/v1/orders/{id}/add-items {items: [...]}
    API->>API: Order State -> AWAITING_CUSTOMER_CONFIRMATION
    API-->>C_App: Push & Real-Time Socket Event: "Order Modification Requested (+75 AED)"
    
    alt Customer Approves
        Cust->>C_App: Taps "Approve Additional 75 AED"
        C_App->>API: POST /api/v1/orders/{id}/confirm-modification
        API->>API: Recalculates Order Total
        API-->>S_App: "Customer Approved! Proceed with extra detailing."
    else Customer Declines
        Cust->>C_App: Taps "Decline"
        C_App->>API: POST /api/v1/orders/{id}/decline-modification
        API-->>S_App: "Customer Declined. Proceed with original package only."
    end
```
