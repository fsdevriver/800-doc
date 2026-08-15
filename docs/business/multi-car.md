# Multi-Car Order Architecture

A flagship capability of 800-CarWash is the ability for a customer to book washes for **multiple vehicles at the same location within a single order checkout**.

---

## 1. Multi-Car Order Principles

In residential villas, family compounds, and workplace parking lots across Dubai, customers frequently book services for **more than one vehicle at the same location** in a single checkout.

```mermaid
graph TD
    ORDER["📦 Single Master Order (#800-10928) - Arabian Ranches"]
    
    ITEM1["🚗 Vehicle 1: BMW 3 Series (Sedan) - Exterior Express (45 AED) + Tire Gel (15 AED)"]
    ITEM2["🚙 Vehicle 2: Range Rover (SUV) - Exterior Express (60 AED) + Tire Gel (15 AED)"]

    ORDER --> ITEM1
    ORDER --> ITEM2
```

### Simplified Customer Journey:
1. **Choose Service**: Customer selects the desired main package (e.g. *Exterior Express Wash*).
2. **Select Vehicle(s)**: Customer checks off the cars to be washed (e.g. *Sedan* and *SUV*). The service price adjusts automatically per vehicle type.
3. **Choose Add-ons**: Customer selects optional enhancements (e.g. *Tire Gel Shine*, *AC Ozone Shot*). All add-ons carry a **universal flat rate** regardless of car type.
4. **Order Creation**: A single master order with individual vehicle items is created.

### Key Operational Rules:
1. **Sequential Field Execution**:
   - A single assigned specialist washes the vehicles **one by one in sequence**.
   - Total service time is calculated cumulatively:
     $$\text{Total Duration} = \sum_{i=1}^{N} \left( \text{Duration}(\text{Service}_i, \text{CarType}_i) + \sum \text{Duration}(\text{Addon}_j) \right)$$
2. **Per-Vehicle Inspection Quality Gates**:
   - The specialist must capture 2–4 "Before" and 2–4 "After" photos **for each individual vehicle item**.
   - Vehicle 1 cannot be marked finished without its photos; Vehicle 2 must have its own separate photo set.

---

## 2. Multi-Car Specialist Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor Spec as 🧑‍🔧 Specialist
    participant App as 📱 Specialist App
    participant API as ⚙️ Backend Core
    participant S3 as ☁️ S3 Storage

    Note over Spec, App: Specialist arrives at location with 2 cars booked
    Spec->>App: Taps "I Have Arrived"
    App->>API: POST /api/v1/specialist/orders/{id}/arrive
    
    Note over Spec, App: --- VEHICLE 1 EXECUTION (Sedan) ---
    Spec->>App: Selects Vehicle 1 (BMW 3 Series)
    Spec->>App: Takes 4 "Before Wash" Photos
    App->>S3: Uploads Before Photos
    Spec->>App: Taps "Start Wash (Car 1)"
    App->>API: POST /api/v1/orders/{id}/items/{item1_id}/start
    Note over Spec: Performs washing on Car 1
    Spec->>App: Takes 4 "After Wash" Photos
    App->>S3: Uploads After Photos
    Spec->>App: Taps "Complete Wash (Car 1)"
    App->>API: POST /api/v1/orders/{id}/items/{item1_id}/complete

    Note over Spec, App: --- VEHICLE 2 EXECUTION (SUV) ---
    Spec->>App: Selects Vehicle 2 (Range Rover)
    Spec->>App: Takes 4 "Before Wash" Photos
    App->>S3: Uploads Before Photos
    Spec->>App: Taps "Start Wash (Car 2)"
    App->>API: POST /api/v1/orders/{id}/items/{item2_id}/start
    Note over Spec: Performs washing on Car 2
    Spec->>App: Takes 4 "After Wash" Photos
    App->>S3: Uploads After Photos
    Spec->>App: Taps "Complete Wash (Car 2)"
    App->>API: POST /api/v1/orders/{id}/items/{item2_id}/complete

    Note over Spec, App: All vehicles completed -> Proceeds to Order Settlement
    Spec->>App: Collects combined payment & Completes Job
```

---

## 3. Customer UI Experience
- The Customer Mobile App features an interactive **"Add Another Vehicle"** button in the booking cart.
- Real-time progress indicators show:
  - `Car 1 (BMW): Completed ✅`
  - `Car 2 (Range Rover): In Progress (Washing) ⏳`
- Customers can preview the clean inspection photos for each car directly in the app.
