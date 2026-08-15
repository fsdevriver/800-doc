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
    J --> K3["10. Tap 'Start Wash'"]
    K3 --> L["11. Detail Vehicle"]
    L --> M["12. Tap 'Complete Wash (Car 1)'"]
    
    M --> N{"Remaining Cars in Order?"}
    N -->|Yes| O["13. Select Next Vehicle"]
    O --> K3
    
    N -->|No| P["14. Collect Payment (Cash / POS Card)"]
    P --> Q["15. Tap 'Complete Job' (Status -> Available)"]
```

---

## 2. Streamlined Service Execution

The specialist workflow prioritizes speed and operational simplicity:

1. **Instant Wash Activation**: Specialist selects the vehicle and taps **"Start Wash"** to begin detailing without photo blockers.
2. **Optional Pre-Existing Damage Flag**: If a technician spots a deep scratch, cracked windshield, or dent before beginning work, they can tap an optional **"Quick Damage Note"** to snap a 3-second photo. This immediately protects the business from false liability claims without blocking the order flow.
3. **Offline-First Basement Mode**: In underground parking structures (P1–B4) with zero network coverage, wash state transitions are saved in the app's local encrypted SQLite database and automatically flushed to the server when network connectivity is restored.
4. **Wash Completion**: Once finished, tapping **"Complete Wash"** advances the car to completed state.
5. **Future Roadmap**: Mandatory multi-angle inspection photo gates remain scheduled for a future version release.
