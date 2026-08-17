# Order & Fulfillment Schema

This document defines the relational database architecture powering orders, multi-vehicle order items, assignment leases, payment ledgers, and inspection photo auditing.

---

## 1. Master Order Table

### `orders`
The master transactional record representing a single customer dispatch.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Primary order identifier. |
| `order_number` | `VARCHAR(30)` | `UNIQUE, NOT NULL` | Human-readable reference (e.g., `800-240815-092`). |
| `customer_id` | `UUID` | `FK -> customer_profiles(id)` | Placing customer profile. |
| `sub_zone_id` | `UUID` | `FK -> sub_zones(id)` | Operating sub-zone. |
| `order_type` | `VARCHAR(30)` | `NOT NULL` | Values: `ON_DEMAND`, `SCHEDULED`, `SUBSCRIPTION`. |
| `fulfillment_status` | `VARCHAR(40)` | `NOT NULL, DEFAULT 'CREATED'` | Values: `CREATED`, `CONFIRMED`, `ASSIGNING`, `ASSIGNED`, `IN_PROGRESS`, `PARTIALLY_COMPLETED`, `COMPLETED`, `CANCELLED`. |
| `assignment_status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'UNASSIGNED'` | Values: `UNASSIGNED`, `RECOMMENDED`, `ASSIGNED`, `ACKNOWLEDGED`, `REASSIGNED`, `REVOKED`. |
| `payment_status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'PENDING'` | Values: `PENDING`, `AUTHORIZED`, `SETTLED`, `PARTIALLY_REFUNDED`, `REFUNDED`, `FAILED`. |
| `cancellation_status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'NONE'` | Values: `NONE`, `REQUESTED`, `CANCELLED_NO_FEE`, `CANCELLED_WITH_FEE`. |
| `cancellation_reason` | `TEXT` | `NULLABLE` | Mandatory explanation if cancelled. |
| `scheduled_start_time` | `TIMESTAMPTZ` | `NULLABLE` | Exact appointment start time (for scheduled orders). |
| `latitude` | `NUMERIC(10,7)` | `NOT NULL` | Delivery latitude. |
| `longitude` | `NUMERIC(10,7)` | `NOT NULL` | Delivery longitude. |
| `address_text` | `TEXT` | `NOT NULL` | Address string with parking/villa details. |
| `subtotal_amount` | `NUMERIC(10,2)` | `NOT NULL` | Sum of all order item base & add-on prices. |
| `discount_amount` | `NUMERIC(10,2)` | `DEFAULT 0.00` | Applied promo code / loyalty discount. |
| `taxable_amount` | `NUMERIC(10,2)` | `NOT NULL` | Amount subject to UAE VAT (`subtotal - discount`). |
| `vat_rate` | `NUMERIC(5,2)` | `NOT NULL, DEFAULT 5.00` | UAE standard VAT percentage (`5.00%`). |
| `vat_amount` | `NUMERIC(10,2)` | `NOT NULL` | Calculated VAT (`taxable_amount * 0.05`). |
| `tip_amount` | `NUMERIC(10,2)` | `DEFAULT 0.00` | Optional customer tip added post-wash. |
| `total_amount` | `NUMERIC(10,2)` | `NOT NULL` | Grand total payable (`taxable_amount + vat_amount + tip_amount`). |
| `pricing_snapshot` | `JSONB` | `NOT NULL` | Immutable checkout pricing snapshot (services, add-ons, discounts, VAT). |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Order placement timestamp. |

---

## 2. Assignment Leases Table

### `order_assignments`
Manages technician assignment leases to guarantee that only the current, authorized specialist can execute commands and prevent stale offline dual-execution conflicts.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Assignment lease identifier. |
| `order_id` | `UUID` | `FK -> orders(id), ON DELETE CASCADE` | Associated order. |
| `specialist_id` | `UUID` | `FK -> specialist_profiles(id)` | Assigned technician. |
| `lease_version` | `INTEGER` | `NOT NULL, DEFAULT 1` | Monotonically increasing lease version. |
| `lease_expires_at` | `TIMESTAMPTZ` | `NOT NULL` | Expiry time for active job lease. |
| `revoked_at` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp if Admin revoked or reassigned the job. |
| `revocation_reason`| `VARCHAR(255)` | `NULLABLE` | Reason (e.g., `SPECIALIST_UNRESPONSIVE_STALE`, `MANUAL_OVERRIDE`). |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Lease creation timestamp. |

---

## 3. Order Items & Add-ons

### `order_items`
Individual vehicle wash tasks attached to a master order (enabling multi-car booking).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique order item identifier. |
| `order_id` | `UUID` | `FK -> orders(id), ON DELETE CASCADE` | Parent master order. |
| `vehicle_id` | `UUID` | `FK -> user_vehicles(id)` | Specific vehicle being washed. |
| `service_id` | `UUID` | `FK -> services(id)` | Core detailing package selected. |
| `base_service_price` | `NUMERIC(10,2)` | `NOT NULL` | Base price for vehicle type at booking time. |
| `addons_total_price` | `NUMERIC(10,2)` | `DEFAULT 0.00` | Sum of selected add-on options. |
| `item_total` | `NUMERIC(10,2)` | `NOT NULL` | Base + Addons price. |
| `estimated_duration_min`| `INTEGER` | `NOT NULL` | Expected completion time in minutes. |
| `execution_status` | `VARCHAR(30)` | `DEFAULT 'PENDING'` | Values: `PENDING`, `EN_ROUTE`, `ARRIVED`, `WASHING`, `COMPLETED`, `SKIPPED`, `ACCESS_FAILED`. |
| `wash_started_at` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp when specialist started washing. |
| `wash_completed_at` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp when specialist completed washing. |

---

### `order_item_addons`
Selected add-ons linked to a specific vehicle item.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique link identifier. |
| `order_item_id` | `UUID` | `FK -> order_items(id), ON DELETE CASCADE` | Target vehicle item. |
| `addon_option_id` | `UUID` | `FK -> addon_options(id)` | Specific add-on selected. |
| `price_at_booking` | `NUMERIC(10,2)` | `NOT NULL` | Price locked at time of order creation. |
| `added_on_site` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Flagged TRUE if added during on-site upsell. |

---

## 4. Immutable Order Event Ledger

### `order_events`
The append-only event ledger capturing every state change, actor provenance, and transition context for dispute resolution and auditability.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Event identifier. |
| `order_id` | `UUID` | `FK -> orders(id), ON DELETE CASCADE` | Target order. |
| `order_item_id` | `UUID` | `FK -> order_items(id), NULLABLE` | Target item (if item-level transition). |
| `event_type` | `VARCHAR(50)` | `NOT NULL` | E.g., `ORDER_CREATED`, `SPECIALIST_ASSIGNED`, `WASH_STARTED`, `ITEM_SKIPPED`, `PAYMENT_SETTLED`. |
| `previous_state` | `VARCHAR(50)` | `NULLABLE` | Previous fulfillment/execution status. |
| `new_state` | `VARCHAR(50)` | `NOT NULL` | New fulfillment/execution status. |
| `actor_type` | `VARCHAR(30)` | `NOT NULL` | Values: `CUSTOMER`, `SPECIALIST`, `ADMIN`, `SYSTEM`. |
| `actor_id` | `UUID` | `NULLABLE` | User ID of the actor performing the transition. |
| `metadata` | `JSONB` | `NULLABLE` | Contextual payload (GPS coordinates, reasons, override flags). |
| `idempotency_key` | `VARCHAR(100)` | `NULLABLE` | Associated client command idempotency key. |
| `occurred_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Server commit timestamp. |

---

## 5. Decoupled Payment Ledger

### `payments`
Master payment ledger record separating billing transactions from order domain models.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Payment record identifier. |
| `order_id` | `UUID` | `FK -> orders(id), ON DELETE CASCADE` | Target order. |
| `payment_method` | `VARCHAR(30)` | `NOT NULL` | Values: `COD`, `POS_CARD`, `STRIPE`, `CHECKOUT_COM`, `APPLE_PAY`. |
| `status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'PENDING'` | Values: `PENDING`, `AUTHORIZED`, `SETTLED`, `PARTIALLY_REFUNDED`, `REFUNDED`, `FAILED`. |
| `currency` | `VARCHAR(10)` | `NOT NULL, DEFAULT 'AED'` | ISO Currency Code. |
| `amount` | `NUMERIC(10,2)` | `NOT NULL` | Total charge amount. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Creation timestamp. |

### `payment_refunds`
Immutable log of all partial and full refunds processed.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Refund identifier. |
| `payment_id` | `UUID` | `FK -> payments(id), ON DELETE CASCADE` | Source payment. |
| `order_item_id` | `UUID` | `FK -> order_items(id), NULLABLE` | Specific vehicle item refunded (for partial sagas). |
| `amount` | `NUMERIC(10,2)` | `NOT NULL` | Refunded amount. |
| `reason` | `VARCHAR(255)` | `NOT NULL` | Reason (e.g., `VEHICLE_ACCESS_FAILED`, `DAMAGE_COMPENSATION`). |
| `processed_by` | `UUID` | `FK -> admin_profiles(id), NULLABLE` | Admin who authorized refund. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Refund timestamp. |

---

## 6. Durable Idempotency Records Table

### `idempotency_records`
PostgreSQL authoritative persistence for idempotent command processing, complementing Redis fast locks.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Record identifier. |
| `actor_id` | `UUID` | `NOT NULL` | User/Specialist/Admin executing command. |
| `key` | `VARCHAR(100)` | `NOT NULL` | Client `Idempotency-Key` UUID. |
| `request_hash` | `VARCHAR(64)` | `NOT NULL` | SHA-256 hash of incoming request body & params. |
| `response_status` | `INTEGER` | `NOT NULL` | HTTP status code returned (`200`, `201`, `202`). |
| `response_body` | `JSONB` | `NOT NULL` | Cached JSON response body. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Execution timestamp. |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | 24-hour expiration timestamp. |

*Unique Constraint*: `UNIQUE (actor_id, key)`

---

## 7. Inspection Photos Table

### `vehicle_inspection_photos`
Quality assurance media records immutably linking photos to vehicles.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Photo record identifier. |
| `order_item_id` | `UUID` | `FK -> order_items(id), ON DELETE CASCADE` | Specific vehicle inspected. |
| `photo_phase` | `VARCHAR(20)` | `NOT NULL` | Values: `BEFORE` (Pre-wash), `AFTER` (Post-wash). |
| `angle_label` | `VARCHAR(50)` | `NULLABLE` | Label: `FRONT`, `REAR`, `LEFT_SIDE`, `RIGHT_SIDE`, `INTERIOR`, `DAMAGE_NOTE`. |
| `s3_key` | `VARCHAR(500)` | `NOT NULL` | S3 object key. |
| `s3_bucket` | `VARCHAR(100)` | `NOT NULL` | S3 bucket name. |
| `uploaded_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Upload timestamp. |

