# Subscriptions & Growth Schema

This document details the database schema supporting recurring subscriptions, promo codes, customer loyalty ledgers, referrals, and staff tipping.

---

## 1. Subscriptions Schema

### `subscriptions`
Recurring customer wash plans.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique subscription identifier. |
| `customer_id` | `UUID` | `FK -> customer_profiles(id)` | Subscriber. |
| `sub_zone_id` | `UUID` | `FK -> sub_zones(id)` | Service sub-zone. |
| `user_location_id` | `UUID` | `FK -> user_locations(id)` | Default recurring address. |
| `frequency` | `VARCHAR(30)` | `NOT NULL` | Values: `WEEKLY`, `BI_WEEKLY`, `MONTHLY`. |
| `day_of_week` | `INTEGER` | `NOT NULL (0-6)` | Recurring appointment day. |
| `preferred_start_time`| `TIME` | `NOT NULL` | Recurring time slot. |
| `status` | `VARCHAR(30)` | `NOT NULL, DEFAULT 'ACTIVE'` | Values: `ACTIVE`, `PAUSED`, `CANCELLED`. |
| `start_date` | `DATE` | `NOT NULL` | Plan commencement date. |
| `next_billing_date` | `DATE` | `NOT NULL` | Next generation date. |

---

## 2. Growth & Marketing Entities

### `promo_codes`
Discount rules and product-targeting vouchers.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Promo record identifier. |
| `code` | `VARCHAR(50)` | `UNIQUE, NOT NULL` | Voucher code (e.g. `DUBAI20`, `SUMMER50`). |
| `discount_type` | `VARCHAR(20)` | `NOT NULL` | Values: `FIXED_AMOUNT`, `PERCENTAGE`. |
| `discount_value` | `NUMERIC(10,2)` | `NOT NULL` | Value (e.g., 20.00 AED or 15.00%). |
| `max_discount_cap` | `NUMERIC(10,2)` | `NULLABLE` | Upper cap for percentage discounts. |
| `min_order_value` | `NUMERIC(10,2)` | `DEFAULT 0.00` | Minimum cart subtotal requirement. |
| `is_first_order_only` | `BOOLEAN` | `DEFAULT FALSE` | Restricts use to new accounts. |
| `target_car_type_id` | `UUID` | `FK -> car_types(id), NULLABLE` | Optional car type targeting (e.g. SUV only). |
| `target_service_id` | `UUID` | `FK -> services(id), NULLABLE` | Optional specific core service targeting. |
| `total_usage_limit` | `INTEGER` | `NULLABLE` | Maximum global redemption count. |
| `per_user_limit` | `INTEGER` | `DEFAULT 1` | Maximum redemptions per user. |
| `start_at` | `TIMESTAMPTZ` | `NOT NULL` | Campaign start time. |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | Expiration timestamp. |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Active voucher status. |

---

### `loyalty_ledger`
Immutable points transaction audit log.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Ledger record identifier. |
| `customer_id` | `UUID` | `FK -> customer_profiles(id)` | Customer account. |
| `order_id` | `UUID` | `FK -> orders(id), NULLABLE` | Associated order (if earned/redeemed via booking). |
| `transaction_type` | `VARCHAR(30)` | `NOT NULL` | Values: `EARNED_ORDER`, `REDEEMED_ORDER`, `REFERRAL_BONUS`, `ADMIN_ADJUSTMENT`, `EXPIRED`. |
| `points_delta` | `INTEGER` | `NOT NULL` | Signed integer (e.g. `+100` or `-50`). |
| `balance_after` | `INTEGER` | `NOT NULL` | Account balance following transaction. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Log timestamp. |

---

### `staff_tips`
Customer gratuity records attributed to detailing specialists.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Tip identifier. |
| `order_id` | `UUID` | `FK -> orders(id), ON DELETE CASCADE` | Associated completed order. |
| `specialist_id` | `UUID` | `FK -> specialist_profiles(id)` | Recipient technician (100% attribution). |
| `amount` | `NUMERIC(10,2)` | `NOT NULL` | Tipped amount (e.g., `10.00 AED`). |
| `payout_status` | `VARCHAR(30)` | `DEFAULT 'PENDING'` | Values: `PENDING`, `SETTLED_PAYROLL`. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Record creation timestamp. |
