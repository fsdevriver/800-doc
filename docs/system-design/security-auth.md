# Security & Authentication

800-CarWash enforces defense-in-depth security principles across mobile clients, administrative interfaces, and backend services.

---

## 1. Multi-Persona Authentication Architecture

```mermaid
graph TD
    subgraph AuthStrategies["Authentication Strategies"]
        OTP["📱 Customer: Phone OTP (SMS code via Twilio/Infobip)"]
        SPEC_AUTH["🧑‍🔧 Specialist: Admin Credentials (Username/Password with Argon2)"]
        ADMIN_AUTH["👨‍💼 Admin Portal: Enterprise Auth (Email + Password + 2FA)"]
    end

    subgraph TokenEngine["Token Engine (NestJS AuthModule)"]
        JWT_AT["🔑 Short-Lived Access Token (JWT 15 mins)"]
        JWT_RT["🔄 Long-Lived Refresh Token (30 days Rotating)"]
    end

    OTP --> JWT_AT
    OTP --> JWT_RT
    SPEC_AUTH --> JWT_AT
    SPEC_AUTH --> JWT_RT
    ADMIN_AUTH --> JWT_AT
    ADMIN_AUTH --> JWT_RT
```

---

## 2. Customer Phone OTP Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Cust as 👤 Customer App
    participant API as ⚙️ Backend Core
    participant Redis as ⚡ Redis (Rate Limit & OTP Store)
    participant SMS as 📱 SMS Gateway

    Cust->>API: POST /api/v1/auth/customer/send-otp {phone: "+971501234567"}
    API->>Redis: Check Rate Limit (Max 3 OTP requests per 10 mins)
    API->>Redis: SETEX otp:+971501234567 300 "849201" (5 min expiry)
    API->>SMS: Dispatch SMS with 6-digit code
    SMS-->>Cust: SMS: "Your 800-CarWash code is 849201"
    
    Cust->>API: POST /api/v1/auth/customer/verify-otp {phone: "+971501234567", code: "849201"}
    API->>Redis: GET otp:+971501234567
    API->>Redis: DEL otp:+971501234567 (Prevent replay attacks)
    API->>API: Find or Create Customer Account
    API-->>Cust: 200 OK {access_token: "...", refresh_token: "...", user: {...}}
```

---

## 3. Data Protection & Security Controls
1. **Network Security**:
    - Enforced HTTPS / TLS 1.3 across all endpoints.
    - Strict CORS policies restricting Admin API routes to authorized domain origins.
2. **Password Security**:
    - Specialist and Admin passwords hashed using **Argon2id** with salt.
3. **Data at Rest & Transit**:
    - Database storage encrypted via AES-256.
    - S3 buckets configured with server-side encryption (`SSE-S3` / `SSE-KMS`) and private access only.
4. **Rate Limiting & DDoS Prevention**:
    - Redis-backed distributed rate limiting via NestJS `@nestjs/throttler` (e.g. 100 req/min for general API, 5 req/min for auth).
