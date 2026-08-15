# Environments & DevOps Pipeline

This document defines the deployment topologies, CI/CD pipeline automation, and infrastructure environments for 800-CarWash.

---

## 1. Environment Topology

```mermaid
graph LR
    subgraph Dev["Local Development"]
        DEV_LOCAL["💻 Developer Laptop (Docker Compose: PG, Redis, S3)"]
    end

    subgraph Staging["Staging Environment"]
        STG_API["⚙️ Staging API (staging-api.800carwash.ae)"]
        STG_WEB["💻 Staging Admin Portal"]
        STG_DB["🐘 Staging PostgreSQL + PostGIS"]
        STG_RD["⚡ Staging Redis"]
    end

    subgraph Prod["Production Environment"]
        PROD_API["⚙️ Production API Cluster (Multi-AZ)"]
        PROD_WEB["💻 Production Admin Portal"]
        PROD_DB["🐘 Production PostgreSQL Primary + Replica"]
        PROD_RD["⚡ Production Redis Cluster"]
    end

    DEV_LOCAL -->|Push to develop| STG_API
    STG_API -->|Promote to main| PROD_API
```

---

## 2. CI/CD Automation (GitHub Actions)

```mermaid
graph TD
    PR["1. GitHub Pull Request Opened"] --> LINT["2. Lint & Type Check (ESLint / TSC)"]
    LINT --> TEST["3. Automated Unit & Integration Tests (Jest)"]
    TEST --> BUILD["4. Build Validation (Docker Image Build)"]
    BUILD --> MERGE["5. PR Approved & Merged to develop / main"]
    
    MERGE --> DEPLOY_STG["6. Auto-Deploy to Staging Environment"]
    MERGE --> DEPLOY_PROD["7. Production Deploy with Canary Release"]
```

### Key GitHub Action Workflow Jobs:
1. **Backend Validation**: Runs `pnpm test`, database migration checks against ephemeral PostgreSQL service containers.
2. **Admin Web Portal**: Turbopack Next.js build verification with zero lint errors.
3. **Mobile Apps**: Fastlane automated builds generating staging APKs / iOS TestFlight builds for QA testing.
