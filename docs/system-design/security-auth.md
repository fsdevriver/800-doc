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

---

## 3. Refresh-Token Family Tracking & Rotation

To prevent token theft and replay attacks on mobile clients, 800-CarWash enforces **Refresh Token Family Rotation**:

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL,
  family_id UUID NOT NULL,
  device_id VARCHAR(100) NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  replaced_by UUID REFERENCES refresh_tokens(id)
);
```

- **Replay Detection**: If a previously used refresh token is presented, the system detects a token reuse breach, immediately **invalidates the entire token family**, and forces the user to re-authenticate with OTP.

---

## 4. Granular Permission & Authorization Matrix

In addition to coarse roles (`CUSTOMER`, `SPECIALIST`, `DISPATCHER`, `SUPER_ADMIN`), the platform enforces granular permission guards:

| Domain | Permission Code | Description | Authorized Roles |
| :--- | :--- | :--- | :--- |
| **Orders** | `ORDER_VIEW` | View order details and active progress | `CUSTOMER`, `SPECIALIST`, `DISPATCHER`, `ADMIN` |
| **Orders** | `ORDER_ASSIGN` | Assign / reassign specialist to an order | `DISPATCHER`, `ADMIN` |
| **Orders** | `ORDER_CANCEL` | Cancel active orders & select reason | `DISPATCHER`, `ADMIN` |
| **Financials**| `REFUND_CREATE` | Authorize partial or full refunds | `FINANCE_ADMIN`, `SUPER_ADMIN` |
| **Catalog** | `PRICE_EDIT` | Modify base service and add-on pricing | `SUPER_ADMIN` |
| **Zones** | `ZONE_EDIT` | Create/edit PostGIS polygon boundaries | `OPS_ADMIN`, `SUPER_ADMIN` |
| **Users** | `USER_SUSPEND` | Suspend customer or specialist account | `OPS_ADMIN`, `SUPER_ADMIN` |
| **Analytics** | `REPORT_VIEW` | Access GMV, revenue, and audit reports | `EXECUTIVE`, `SUPER_ADMIN` |

---

## 5. Enterprise Admin Portal Authentication
- **OIDC / SAML SSO**: Operations and Admin web portals support Google Workspace / Microsoft Entra OIDC Single Sign-On.
- **Mandatory MFA**: Multi-Factor Authentication (TOTP via Authenticator App) enforced for all administrative and dispatch roles.

