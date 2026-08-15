# Customer REST API Specification

This document specifies the core API endpoints consumed by the **Customer Mobile App**.

---

## 1. Authentication & Profile

### `POST /api/v1/auth/customer/send-otp`
Sends a 6-digit verification code via SMS.
```json
// Request Body
{
  "phone_number": "+971501234567"
}

// Response: 200 OK
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "expires_in_seconds": 300
  }
}
```

### `POST /api/v1/auth/customer/verify-otp`
Verifies OTP code and returns access token.
```json
// Request Body
{
  "phone_number": "+971501234567",
  "code": "849201"
}

// Response: 200 OK
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "refresh_token": "dGhpcy1pcy1hLXJlZnJlc2g...",
    "user": {
      "id": "7b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e",
      "phone_number": "+971501234567",
      "is_profile_completed": false,
      "full_name": null,
      "email": null,
      "loyalty_points": 0,
      "referral_code": "HAMDAN800"
    }
  }
}
```

### `PUT /api/v1/customer/profile`
Mandatory profile onboarding upon first registration. `full_name` is strictly required; `email` is optional.
```json
// Request Body
{
  "full_name": "Hamdan Al-Maktoum",
  "email": "hamdan@example.ae" // Optional
}

// Response: 200 OK
{
  "success": true,
  "data": {
    "id": "7b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e",
    "full_name": "Hamdan Al-Maktoum",
    "email": "hamdan@example.ae",
    "is_profile_completed": true
  }
}
```

---

## 2. Vehicle Garage Management

### `GET /api/v1/customer/vehicles`
Lists all vehicles saved in the customer's garage.

### `POST /api/v1/customer/vehicles`
Adds a new car to the customer's profile.
```json
// Request Body
{
  "car_type_id": "3a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
  "brand_name": "Porsche",
  "model_name": "Cayenne GTS",
  "registered_emirate": "Dubai",
  "plate_code": "A",
  "plate_number": "80021",
  "color": "Metallic Black"
}
```

---

## 3. Order Placement & Tracking

### `POST /api/v1/zones/check-location`
Validates whether a GPS pin falls within an active service sub-zone.
```json
// Request Body
{
  "latitude": 25.1972,
  "longitude": 55.2744
}

// Response: 200 OK
{
  "success": true,
  "data": {
    "is_serviced": true,
    "sub_zone_id": "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
    "sub_zone_name": "Downtown Dubai & Business Bay"
  }
}
```

### `POST /api/v1/orders/checkout`
Creates a master order for one or more vehicles with selected service & flat-rate add-ons.
```json
// Request Body
{
  "service_id": "8a9b0c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d", // e.g. Exterior Express Wash
  "order_type": "ON_DEMAND", // ON_DEMAND | SCHEDULED | SUBSCRIPTION
  "scheduled_start_time": null, // ISO8601 if SCHEDULED
  "location_id": "9b0c1d2e-3f4a-5b6c-7d8e-9f0a1b2c3d4e",
  "vehicles": [
    {
      "vehicle_id": "4c5d6e7f-8a9b-0c1d-2e3f-4a5b6c7d8e9f", // Sedan (45 AED)
      "addon_ids": [
        "1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e" // Tire Gel Flat Rate (15 AED)
      ]
    },
    {
      "vehicle_id": "5d6e7f8a-9b0c-1d2e-3f4a-5b6c7d8e9f0a", // SUV (60 AED)
      "addon_ids": [
        "1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e" // Tire Gel Flat Rate (15 AED)
      ]
    }
  ],
  "promo_code": "WELCOME20",
  "redeem_loyalty_points": 50,
  "payment_method": "COD" // COD | POS_CARD
}

// Response: 201 Created
{
  "success": true,
  "data": {
    "order_id": "9f0a1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
    "order_number": "800-240816-014",
    "subtotal_amount": 135.00,
    "discount_amount": 20.00,
    "total_amount": 115.00,
    "status": "ORDER_CREATED",
    "total_estimated_duration_min": 65
  }
}
```

### `GET /api/v1/customer/orders/{id}/tracking`
Retrieves live order state, assigned specialist details, and vehicle inspection photos.

### `POST /api/v1/customer/orders/{id}/rate-tip`
Submits 1–5 star feedback and optional staff gratuity.
```json
// Request Body
{
  "rating": 5,
  "feedback_comment": "Super clean finish! Very polite technician.",
  "tip_amount": 20.00
}
```
