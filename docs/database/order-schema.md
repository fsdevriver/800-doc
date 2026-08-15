# Order & Fulfillment Schema

This document defines the relational database architecture powering orders, multi-vehicle order items, and inspection photo auditing.

---

## 1. Primary Order Tables

### `orders`
The master transactional record representing a single customer dispatch.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Primary order identifier. |
| `order_number` | `VARCHAR(30)` | `UNIQUE, NOT NULL` | Human-readable reference (e.g., `800-240815-092`). |
| `customer_id` | `UUID` | `FK -> customer_profiles(id)` | Placing customer profile. |
| `specialist_id` | `UUID` | `FK -> specialist_profiles(id), NULLABLE` | Assigned detailing specialist. |
| `sub_zone_id` | `UUID` | `FK -> sub_zones(id)` | Operating sub-zone. |
| `order_type` | `VARCHAR(30)` | `NOT NULL` | Values: `ON_DEMAND`, `SCHEDULED`, `SUBSCRIPTION`. |
| `status` | `VARCHAR(40)` | `NOT NULL, DEFAULT 'ORDER_CREATED'` | Lifecycle state: `ORDER_CREATED`, `ASSIGNED`, `ACKNOWLEDGED`, `EN_ROUTE`, `ARRIVED`, `WASHING`, `PAYMENT_PENDING`, `COMPLETED`, `CANCELLED_BY_CUSTOMER`, `CANCELLED_BY_SPECIALIST`. |
| `cancellation_reason` | `TEXT` | `NULLABLE` | Mandatory message provided when specialist cancels order. |
| `scheduled_start_time` | `TIMESTAMPTZ` | `NULLABLE` | Exact appointment start time (for scheduled orders). |
| `latitude` | `NUMERIC(10,7)` | `NOT NULL` | Delivery latitude. |
| `longitude` | `NUMERIC(10,7)` | `NOT NULL` | Delivery longitude. |
| `address_text` | `TEXT` | `NOT NULL` | Address string with parking/villa details. |
| `subtotal_amount` | `NUMERIC(10,2)` | `NOT NULL` | Sum of all order item prices. |
| `discount_amount` | `NUMERIC(10,2)` | `DEFAULT 0.00` | Applied promo code / loyalty discount. |
| `tip_amount` | `NUMERIC(10,2)` | `DEFAULT 0.00` | Optional customer tip added post-wash. |
| `total_amount` | `NUMERIC(10,2)` | `NOT NULL` | Final payable amount. |
| `payment_method` | `VARCHAR(30)` | `NOT NULL` | Values: `COD` (Cash on Delivery), `POS_CARD` (Card on Delivery). |
| `payment_status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'PENDING'` | Values: `PENDING`, `PAID`, `REFUNDED`. |
| `payment_reference` | `VARCHAR(100)` | `NULLABLE` | Optional POS terminal reference or cash note. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Order placement timestamp. |

---

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
| `execution_status` | `VARCHAR(30)` | `DEFAULT 'PENDING'` | Values: `PENDING`, `WASHING`, `COMPLETED`. |
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
