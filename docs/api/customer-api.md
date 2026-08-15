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

### `POST /api/v1/customer/orders/checkout`
Creates a single or multi-car order.
```json
// Request Body
{
  "order_type": "SCHEDULED", // or "ON_DEMAND"
  "scheduled_start_time": "2026-08-16T10:00:00.000Z",
  "latitude": 25.1972,
  "longitude": 55.2744,
  "address_text": "Villa 14, Street 2B, Arabian Ranches",
  "parking_floor_spot": "Main Driveway",
  "access_instructions": "Gate code #4421",
  "payment_method": "POS_CARD", // or "COD"
  "promo_code": "DUBAI20",
  "redeem_loyalty_points": 100,
  "items": [
    {
      "vehicle_id": "4b5c6d7e-8f9a-0b1c-2d3e-4f5a6b7c8d9e",
      "service_id": "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
      "addon_option_ids": [
        "8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d"
      ]
    },
    {
      "vehicle_id": "5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f",
      "service_id": "2d3e4f5a-6b7c-8d9e-0f1a-2b3c4d5e6f7a",
      "addon_option_ids": []
    }
  ]
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
