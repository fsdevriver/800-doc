# Operational Exceptions & Specialist Cancellation Matrix

In a mobile on-demand detailing operation, physical field anomalies (locked gates, inaccessible underground parking, vehicle breakdowns, customer unreachable) are standard occurrences. 

800-CarWash establishes deterministic, zero-penalty protocols. If an order cannot proceed, the **specialist can cancel the order with a mandatory message** explaining the exact operational reason.

---

## 1. Exception Handling Matrix

| Operational Scenario | Initiated By | System Trigger / Action | Customer Impact | Specialist & Ops Action |
| :--- | :--- | :--- | :--- | :--- |
| **Specialist Cancellation (Field Obstacle)** | Specialist | `POST /api/v1/specialist/orders/{id}/cancel` with explanation message. | Order status $\rightarrow$ `CANCELLED_BY_SPECIALIST`. Push notification explaining reason. | **0% Penalty**. Specialist is immediately freed to `AVAILABLE`. Ops admin notified. |
| **Customer Cancellation** | Customer | Customer cancels order from app. | Order status $\rightarrow$ `CANCELLED_BY_CUSTOMER`. **0% Penalty**. | Specialist freed back to `AVAILABLE`. |
| **Vehicle Inaccessible / Locked** | Specialist | Specialist taps "Report Inaccessible / Unreachable". | Automated 10-minute waiting timer + SMS/Push notification sent to customer. | If customer does not appear, specialist cancels with explanation message. |
| **Technician Van Breakdown** | Specialist | Specialist flags emergency: "Equipment / Van Breakdown". | Order status $\rightarrow$ `DISPATCH_ISSUE`. Customer offered immediate reassignment or reschedule. | Ops dashboard receives audible alarm; 1-click reassignment to nearest specialist. |
| **On-Site Service Upsell** | Customer / Specialist | Specialist proposes extra treatment $\rightarrow$ `AWAITING_CUSTOMER_CONFIRMATION`. | Real-time modal appears on customer app with price delta. | Specialist cannot start extra service until customer taps "Accept". |

---

## 2. Specialist Order Cancellation Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Spec as 🧑‍🔧 Specialist
    actor Cust as 👤 Customer
    participant App as 📱 Specialist App
    participant API as ⚙️ Backend Core
    participant Ops as 👨‍💼 Ops Dashboard

    Note over Spec: Arrives at location, car is locked / inaccessible / weather hazard
    Spec->>App: Taps "Cancel Order"
    Spec->>App: Enters mandatory cancellation reason (e.g. "Basement gate locked, security denied access")
    App->>API: POST /api/v1/specialist/orders/{id}/cancel {cancellation_reason: "..."}
    
    API->>API: Updates Order Status -> CANCELLED_BY_SPECIALIST (0 Fee)
    API->>API: Sets Specialist Status -> AVAILABLE
    
    par Real-Time Notifications
        API-->>Cust: Push & SMS: "Your order was cancelled: [Reason]"
        API-->>Ops: WebSocket 'admin:order:cancelled' (Logs specialist message)
    end
    
    App-->>Spec: "Order cancelled successfully. Ready for next dispatch."
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
