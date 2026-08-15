# Multi-Car Order Architecture

A flagship capability of 800-CarWash is the ability for a customer to book washes for **multiple vehicles at the same location within a single order checkout**.

---

## 1. Multi-Car Order Principles

In residential villas, family compounds, and workplace parking lots across Dubai, customers often own more than one vehicle (e.g. 1 Sedan and 1 SUV).

```mermaid
graph TD
    ORDER["📦 Single Master Order (#800-10928) - Arabian Ranches"]
    
    ITEM1["🚗 Item 1: BMW 3 Series (Sedan) - Exterior Express (Completed)"]
    ITEM2["🚙 Item 2: Range Rover (SUV) - Full Signature Care (Washing)"]

    ORDER --> ITEM1
    ORDER --> ITEM2
```

### Key Business Rules:
1. **Heterogeneous Vehicle Configurations**:
    - Different car types have different baseline prices.
    - Each vehicle can have completely different core services and add-on selections.
2. **Sequential Field Execution**:
    - A single assigned specialist washes the vehicles **one by one in sequence**.
    - Total estimated service time is the cumulative sum of all vehicles' durations:
      $$\text{Total Duration} = \sum_{i=1}^{N} \left( \text{Duration}(\text{Service}_i) + \sum \text{Duration}(\text{Addon}_{i, j}) \right)$$
3. **Independent Photo Quality Gates**:
    - The specialist must capture and upload 2–4 "Before" and 2–4 "After" photos **for each individual vehicle**.
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
