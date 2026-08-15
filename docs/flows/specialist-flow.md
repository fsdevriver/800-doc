# Specialist Mobile App User Flow

This document details the operational workflow, inspection gates, and field interactions within the **Specialist Mobile App (React Native)**.

---

## 1. Specialist Field Execution Flow

```mermaid
graph TD
    A["1. Staff Login & Shift Toggle (Active)"] --> B["2. Order Dispatched by Admin"]
    B --> C["3. Review Job Details (Vehicles, Gate Codes, Address)"]
    C --> D["4. Tap 'Start Journey' (GPS Telemetry Stream Starts)"]
    
    D --> E["5. Turn-by-Turn Navigation to Location"]
    E --> F["6. Tap 'I Have Arrived'"]
    
    F --> G{"Vehicle Accessible?"}
    G -->|No / Locked| H["7. Trigger 'Report Inaccessible' (10-min Timer)"]
    H -->|Customer Arrives| I["8. Select Vehicle 1"]
    H -->|Timeout Exceeded| J["❌ Cancelled No-Show (Ops Alert)"]
    
    G -->|Yes| I
    I --> K["9. Capture 4 'Before Wash' Photos"]
    K --> L["10. Tap 'Start Wash'"]
    L --> M["11. Detail Vehicle"]
    M --> N["12. Capture 4 'After Wash' Photos"]
    N --> O["13. Tap 'Complete Wash (Car 1)'"]
    
    O --> P{"Remaining Cars in Order?"}
    P -->|Yes| Q["14. Select Next Vehicle"]
    Q --> K
    
    P -->|No| R["15. Collect Payment (Cash / POS Card)"]
    R --> S["16. Tap 'Complete Job' (Status -> Available)"]
```

---

## 2. Mandatory Inspection Photo Gate

The mobile application enforces strict software validation:
1. The **"Start Wash"** button remains disabled until 4 distinct "Before Wash" photos are captured and confirmed uploaded to S3.
2. The **"Complete Wash"** button remains disabled until 4 corresponding "After Wash" photos are captured and verified.
3. If pre-existing scratch or paint damage is identified, the specialist can take a flagged **"Damage Note"** photo to protect the platform from liability.
