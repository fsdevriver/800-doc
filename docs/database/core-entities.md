# Core Entities Schema

This document details the PostgreSQL schema definitions and field data dictionaries for core user, vehicle catalog, and location entities.

---

## 1. User & Profile Entities

### `users`
Central identity entity for all platform actors.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Primary unique identifier. |
| `phone_number` | `VARCHAR(20)` | `UNIQUE, NULLABLE` | E.164 phone number (e.g., `+971501234567`). |
| `email` | `VARCHAR(255)` | `UNIQUE, NULLABLE` | Email address (mandatory for Admin/Specialist). |
| `password_hash` | `VARCHAR(255)` | `NULLABLE` | Argon2id password hash for staff/specialists. |
| `role` | `ENUM` | `NOT NULL, DEFAULT 'CUSTOMER'` | Values: `CUSTOMER`, `SPECIALIST`, `OPS_ADMIN`, `SUPER_ADMIN`. |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Active account status flag. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Record creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Record last update timestamp. |

---

### `customer_profiles`
Extended profile for vehicle owners.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Profile identifier. |
| `user_id` | `UUID` | `FK -> users(id), ON DELETE CASCADE` | 1-to-1 link to user identity. |
| `full_name` | `VARCHAR(100)` | `NULLABLE` | Customer display name (mandatory on profile setup). |
| `is_profile_completed` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Gate flag: must be TRUE before booking. |
| `loyalty_points_balance` | `INTEGER` | `NOT NULL, DEFAULT 0` | Current available loyalty points. |
| `referral_code` | `VARCHAR(20)` | `UNIQUE, NOT NULL` | Unique sharing code (e.g., `ALICE800`). |
| `referred_by_id` | `UUID` | `FK -> customer_profiles(id), NULLABLE` | Profile of referring customer. |

---

### `specialist_profiles`
Operational profile for detailing team members.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Specialist identifier. |
| `user_id` | `UUID` | `FK -> users(id), ON DELETE CASCADE` | 1-to-1 link to user identity. |
| `full_name` | `VARCHAR(100)` | `NOT NULL` | Specialist technician name. |
| `employee_code` | `VARCHAR(50)` | `UNIQUE, NOT NULL` | Staff ID (e.g., `SPEC-042`). |
| `base_sub_zone_id` | `UUID` | `FK -> sub_zones(id), NULLABLE` | Primary assigned operational territory. |
| `operational_status` | `ENUM` | `NOT NULL, DEFAULT 'OFFLINE'` | Values: `AVAILABLE`, `ASSIGNED`, `EN_ROUTE`, `WASHING`, `ON_BREAK`, `SICK`, `OFFLINE`. |
| `rating_average` | `NUMERIC(3,2)` | `DEFAULT 5.00` | Running average customer rating (1.00 - 5.00). |
| `total_jobs_completed` | `INTEGER` | `DEFAULT 0` | Historical completed wash count. |

---

## 2. Vehicle Catalog & User Garages

### `car_types`
Admin-defined vehicle classifications.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique identifier. |
| `code` | `VARCHAR(50)` | `UNIQUE, NOT NULL` | Code key (e.g. `SEDAN`, `SUV`, `LUXURY`, `VAN`). |
| `name` | `VARCHAR(100)` | `NOT NULL` | Display label (e.g. `Sedan / Hatchback`). |
| `icon_url` | `VARCHAR(500)` | `NULLABLE` | S3 asset URL for car type icon. |

---

### `user_vehicles`
Vehicles saved in a customer's garage.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Unique vehicle identifier. |
| `customer_id` | `UUID` | `FK -> customer_profiles(id), ON DELETE CASCADE` | Owner profile. |
| `car_type_id` | `UUID` | `FK -> car_types(id)` | Vehicle class category. |
| `brand_name` | `VARCHAR(100)` | `NOT NULL` | Make (e.g., `Porsche`, `Toyota`, `BMW`). |
| `model_name` | `VARCHAR(100)` | `NOT NULL` | Model (e.g., `Cayenne`, `Camry`, `330i`). |
| `registered_emirate` | `VARCHAR(50)` | `NOT NULL` | Registered City/Emirate (e.g., `Dubai`, `Abu Dhabi`). |
| `plate_code` | `VARCHAR(10)` | `NOT NULL` | Plate category/alphabet (e.g., `A`, `Q`, `12`). |
| `plate_number` | `VARCHAR(20)` | `NOT NULL` | Numeric plate value (e.g., `80021`). |
| `color` | `VARCHAR(50)` | `NOT NULL` | Vehicle exterior color (e.g., `Metallic Black`). |

---

## 3. Location Entities

### `user_locations`
Customer saved addresses with precise parking notes.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Location identifier. |
| `customer_id` | `UUID` | `FK -> customer_profiles(id), ON DELETE CASCADE` | Owner profile. |
| `title` | `VARCHAR(50)` | `NOT NULL` | Label: `Home`, `Office`, `Garage`, or custom. |
| `address_text` | `TEXT` | `NOT NULL` | Reverse-geocoded road / area description. |
| `latitude` | `NUMERIC(10,7)` | `NOT NULL` | Latitude coordinate (WGS 84). |
| `longitude` | `NUMERIC(10,7)` | `NOT NULL` | Longitude coordinate (WGS 84). |
| `sub_zone_id` | `UUID` | `FK -> sub_zones(id), NULLABLE` | Spatial sub-zone containing coordinates. |
| `building_villa_no` | `VARCHAR(100)` | `NULLABLE` | Apartment / Villa / Building number (Optional). |
| `parking_floor_spot` | `VARCHAR(100)` | `NULLABLE` | Parking floor and bay (e.g. `B2 - Spot 41`). |
| `access_instructions` | `TEXT` | `NULLABLE` | Gate codes, landmark descriptions (Optional). |
