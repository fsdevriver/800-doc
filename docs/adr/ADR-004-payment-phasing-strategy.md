# ADR-004: Phased Payment Strategy (Cash/POS v1 to Online Gateway v2)

## Status
**ACCEPTED**

## Context
In the UAE mobile car wash market, Cash on Delivery (COD) and On-site Card Swipe (via wireless POS terminal) represent the dominant initial payment channels. Integrating complex digital payment gateways and PCI-DSS compliance before operational launch adds unnecessary time-to-market friction.

## Decision
We implement a **Phased Payment Strategy**:
- **Phase 1 (MVP Launch)**: Support **Cash on Delivery (COD)** and **On-site Mobile POS Terminal (POS_CARD)**.
  - Recording POS terminal transaction IDs or exact cash amounts in the specialist app is optional in v1.
- **Phase 2 (Post-Launch Upgrade)**: Integrate an online payment gateway (Checkout.com / Stripe / Apple Pay / Google Pay / Tabby BNPL) with card tokenization for automated subscription recurring billing.

## Consequences
### Positive:
- **Fast Time-to-Market**: Removes gateway onboarding, merchant account approvals, and 3D-Secure failure edge-cases from v1 scope.
- **High Local Adoption**: Directly accommodates standard doorstep payment preferences across Dubai communities.

### Negative:
- On-site cash handling requires daily/weekly cash reconciliation by operations managers.
