# ADR-001: Adoption of Modular Monolith Architecture

## Status
**ACCEPTED**

## Context
800-CarWash requires rapid feature iteration, robust transactional data integrity, and low operational overhead during Phase 1 across its four core applications (Backend Core, Admin Web, Customer Mobile, Specialist Mobile). A distributed microservices architecture at this stage would introduce significant operational complexity (distributed transactions, saga orchestrations, network latency, multiple CI/CD pipelines).

## Decision
We adopt a **Modular Monolith architecture** built with **NestJS (Node.js 22 LTS / TypeScript)**.

The codebase is organized into bounded, decoupled domain modules:
- `AuthModule`
- `ZoneModule` (Spatial Geofencing)
- `CatalogModule` (Services, Addons, Pricing)
- `OrderModule` (Checkout, Multi-car, Lifecycle)
- `DispatchModule` (Real-Time WebSockets)
- `SubscriptionModule`
- `PromotionModule`
- `MediaModule`

## Consequences
### Positive:
- **ACID Transactions**: Direct database transactions across orders, order items, inventory, and loyalty balances without distributed consensus overhead.
- **Simplified Deployment**: Single containerized backend deployment on AWS ECS / DigitalOcean Kubernetes.
- **Type Safety**: End-to-end shared TypeScript interfaces across backend DTOs and frontend apps.

### Negative:
- Horizontal scaling scales the entire monolith rather than individual high-load modules (mitigated by offloading background tasks to BullMQ workers).
