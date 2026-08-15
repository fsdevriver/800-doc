# Specialist Mobile App User Flow

This document details the operational workflow, inspection gates, and field interactions within the **Specialist Mobile App (React Native)**.

---

## 1. Specialist Field Execution Flow

```mermaid
graph TD
    A["1. Staff Login & Shift Toggle (Active)"] --> B["2. Order Dispatched by Admin"]
    B --> C["3. Review Job Details (Vehicles, Gate Codes, Address)"]
    C --> D["4. Tap 'Acknowledge Order' (Ops Admin Notified)"]
    D --> E["5. Tap 'Start Journey' (GPS Telemetry Stream Starts)"]
    
    E --> F["6. Turn-by-Turn Navigation to Location"]
    F --> G["7. Tap 'I Have Arrived'"]
    
    G --> H{"Vehicle Accessible?"}
    H -->|No / Locked / Unreachable| I["8. Trigger 'Report Inaccessible' (10-min Timer)"]
    I -->|Customer Arrives| J["9. Select Vehicle 1"]
    I -->|Timeout Exceeded / Inaccessible| K["9. Tap 'Request Cancellation' & Enter Reason"]
    K --> K2["10. Admin Ops Approves Cancellation (Status -> Available)"]
    
    H -->|Yes| J
    J --> L["10. Capture 4 'Before Wash' Photos"]
    L --> M["11. Tap 'Start Wash'"]
    M --> N["12. Detail Vehicle"]
    N --> O["13. Capture 4 'After Wash' Photos"]
    O --> P["14. Tap 'Complete Wash (Car 1)'"]
    
    P --> Q{"Remaining Cars in Order?"}
    Q -->|Yes| R["15. Select Next Vehicle"]
    R --> L
    
    Q -->|No| S["16. Collect Payment (Cash / POS Card)"]
    S --> T["17. Tap 'Complete Job' (Status -> Available)"]
```

---

## 2. Mandatory Inspection Photo Gate

The mobile application enforces strict software validation:

1. The **"Start Wash"** button remains disabled until 4 distinct "Before Wash" photos are captured and confirmed uploaded to S3.
2. The **"Complete Wash"** button remains disabled until 4 corresponding "After Wash" photos are captured and verified.
3. If pre-existing scratch or paint damage is identified, the specialist can take a flagged **"Damage Note"** photo to protect the platform from liability.
