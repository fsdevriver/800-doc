# Customer Mobile App User Flow

This document details the end-to-end user experience and screen progression within the **Customer Mobile App (React Native)**.

---

## 1. Complete Customer Journey Map

```mermaid
graph TD
    A["1. App Launch / Landing"] --> B{"Authenticated?"}
    B -->|No| C["2. Phone Number Entry"]
    C --> D["3. 6-Digit SMS OTP Verification"]
    D --> E{"Profile Completed?"}
    E -->|New User / Incomplete| F["4. Mandatory Profile Completion (Name mandatory, Email optional)"]
    F --> G["5. Home Dashboard"]
    E -->|Existing User| G
    B -->|Yes| G

    G --> H["6. Service Package Selection"]
    H --> I["7. Vehicle Selection & Add-on Customization"]
    I --> J{"Add Another Car?"}
    J -->|Yes| I
    J -->|No| K["8. Time Mode: On-Demand vs. Scheduled Slot"]
    
    K --> L["9. Location Pin Picker / Saved Address"]
    L --> M{"Geofence Check (PostGIS)"}
    M -->|Outside Service Area| N["⚠️ 'Service Unavailable' Alert (Blocked)"]
    N --> L
    M -->|Inside Sub-Zone| O["10. Checkout & Payment Method (COD / POS)"]
    
    O --> P["11. Order Placed & Specialist Assigned"]
    P --> Q["12. Live GPS Tracking (En Route)"]
    Q --> R["13. Inspection Photos & Washing Progress"]
    R --> S["14. Payment Settlement"]
    S --> T["15. 1-5 Star Rating & Specialist Tipping"]
    T --> U["16. PDF Invoice Emailed & Loyalty Awarded"]
```

---

## 2. Key Screen Breakdown

### Screen 1: Home & Garage
- View registered vehicles (e.g. `Porsche Cayenne GTS - Dubai A 80021`).
- Quick-action buttons: **Book Wash**, **Active Subscriptions**, **Loyalty Balance**.

### Screen 2: Multi-Car Configuration Sheet
- Step 1: Pick Service (e.g. *Signature In & Out*).
- Step 2: Configure Add-ons (e.g. *Leather Conditioner*, *Oud Fragrance*).
- Step 3: Assign to Car 1.
- Step 4: Tap `+ Add Another Vehicle` $\rightarrow$ Repeat for Car 2.

### Screen 3: Live Journey & Washing Screen
- Live Map rendering Specialist vehicle pin with smooth interpolation.
- Vehicle Inspection Gallery: Expandable Before & After photos captured by the technician.
- Real-time notification if specialist requests an on-site add-on.
