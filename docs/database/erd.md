# Comprehensive Database ERD

The 800-CarWash persistence tier is designed with relational rigor and spatial PostGIS extensions in **PostgreSQL 17+**.

---

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ CUSTOMER_PROFILES : has
    USERS ||--o{ SPECIALIST_PROFILES : has
    USERS ||--o{ ADMIN_PROFILES : has
    
    CUSTOMER_PROFILES ||--o{ USER_VEHICLES : owns
    CUSTOMER_PROFILES ||--o{ USER_LOCATIONS : saves
    CUSTOMER_PROFILES ||--o{ ORDERS : places
    CUSTOMER_PROFILES ||--o{ SUBSCRIPTIONS : subscribes
    CUSTOMER_PROFILES ||--o{ LOYALTY_LEDGER : earns_spends
    
    CAR_BRANDS ||--o{ CAR_MODELS : manufactures
    CAR_TYPES ||--o{ CAR_MODELS : categorizes
    CAR_MODELS ||--o{ USER_VEHICLES : defines
    
    SERVICE_ZONES ||--o{ SUB_ZONES : partitions
    SUB_ZONES ||--o{ SPECIALIST_PROFILES : base_zone
    SUB_ZONES ||--o{ SLOT_CAPACITIES : schedules
    SUB_ZONES ||--o{ ORDERS : located_in
    
    SERVICES ||--o{ SERVICE_PRICING : has_rates
    CAR_TYPES ||--o{ SERVICE_PRICING : applies_to
    SERVICES ||--o{ SERVICE_ADDON_GROUPS : links
    ADDON_GROUPS ||--o{ SERVICE_ADDON_GROUPS : linked_with
    ADDON_GROUPS ||--o{ ADDON_OPTIONS : contains
    ADDON_OPTIONS ||--o{ ADDON_PRICING : has_rates
    CAR_TYPES ||--o{ ADDON_PRICING : applies_to
    
    ORDERS ||--|{ ORDER_ITEMS : contains
    ORDERS ||--o| SPECIALIST_PROFILES : assigned_to
    ORDERS ||--o| PROMO_CODES : uses
    ORDERS ||--o{ STAFF_TIPS : receives
    
    ORDER_ITEMS ||--|| USER_VEHICLES : washes
    ORDER_ITEMS ||--|| SERVICES : executes
    ORDER_ITEMS ||--o{ ORDER_ITEM_ADDONS : includes
    ORDER_ITEMS ||--o{ VEHICLE_INSPECTION_PHOTOS : inspects
    
    SUBSCRIPTIONS ||--o{ SUBSCRIPTION_OCCURRENCES : generates
    SUBSCRIPTION_OCCURRENCES ||--o| ORDERS : triggers

    USERS {
        uuid id PK
        string phone_number
        string email
        string password_hash
        string role
        timestamp created_at
    }

    CAR_TYPES {
        uuid id PK
        string code
        string name
    }

    SERVICES {
        uuid id PK
        string title
        string description
        boolean is_active
    }

    ORDERS {
        uuid id PK
        string order_number
        uuid customer_id FK
        uuid specialist_id FK
        uuid sub_zone_id FK
        string order_type
        string status
        decimal total_amount
        string payment_method
        string payment_status
        timestamp scheduled_start_time
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid vehicle_id FK
        uuid service_id FK
        decimal base_price
        decimal addons_price
        decimal item_total
        string status
    }

    VEHICLE_INSPECTION_PHOTOS {
        uuid id PK
        uuid order_item_id FK
        string photo_phase
        string s3_key
        timestamp uploaded_at
    }

    SUB_ZONES {
        uuid id PK
        uuid parent_zone_id FK
        string name
        geometry boundary_polygon
        boolean is_active
    }
```

---

## 2. Relational Design Rationale

1. **Normalized Multi-Vehicle Schema (`ORDERS` $\rightarrow$ `ORDER_ITEMS`)**:
   - Isolating each vehicle into its own `ORDER_ITEMS` row guarantees individual status tracking, independent add-on attachments, and separate Before/After photo collections.
2. **PostGIS Native Geometries**:
   - `SUB_ZONES.boundary_polygon` uses `geometry(Polygon, 4326)` with a spatial **GIST index** for instant spatial joins and Point-in-Polygon validation.
3. **Price Matrices Isolation**:
   - `SERVICE_PRICING` and `ADDON_PRICING` decouple price definitions from the core service catalog, enabling vehicle-type specific rate configurations without duplicating service records.
