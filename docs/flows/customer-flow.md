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
    E -->|New User / Incomplete| F["4. Mandatory Profile Setup (Name mandatory, Email optional)"]
    F --> G["5. Home Dashboard"]
    E -->|Existing User| G
    B -->|Yes| G

    G --> H["6. Step 1: Choose Main Service Package"]
    H --> I["7. Step 2: Select Car(s) from Garage"]
    I --> J["8. Step 3: Choose Desired Add-ons (Flat-rate)"]
    
    J --> K["9. Step 4: Pick Timing (On-Demand or Scheduled Slot)"]
    K --> L["10. Step 5: Location Picker & Geofence Validation"]
    L --> M{"Inside Active Service Zone?"}
    M -->|Outside| N["⚠️ 'Service Unavailable' Alert (Blocked)"]
    N --> L
    M -->|Inside| O["11. Step 6: Checkout & Order Creation (COD / POS)"]
    
    O --> P["12. Order Dispatched to Specialist"]
    P --> Q["13. Real-Time Tracking & Inspection Photos"]
    Q --> R["14. Wash Complete & Payment Settlement"]
    R --> S["15. Rating, Tip & Digital Invoice"]
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
