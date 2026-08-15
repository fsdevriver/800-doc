# ADR-006: Direct-to-S3 Pre-signed Media Upload Architecture

## Status
**ACCEPTED**

## Context
With mandatory quality gates requiring 2–4 "Before" and 2–4 "After" inspection photos per vehicle, high-resolution image uploads through the backend NestJS application server would cause severe memory pressure, bandwidth saturation, and slow API response times.

## Decision
We implement a **Direct-to-S3 Pre-signed Upload Architecture**:
1. Mobile client requests pre-signed upload URLs from the backend `MediaModule`.
2. Backend validates specialist authorization and issues short-lived (10-minute) S3 pre-signed `PUT` URLs.
3. Mobile client uploads images directly to Amazon S3 (with client-side JPEG compression).
4. Mobile client notifies backend with S3 object keys upon upload completion to unlock the next workflow stage.

## Consequences
### Positive:
- **Zero Backend Bandwidth Load**: API gateway handles zero binary payload traffic for inspection photos.
- **Fast Upload Speed**: Direct multi-part S3 edge ingestion.
- **High Concurrency**: The system easily supports hundreds of concurrent photo uploads without degrading API performance.

### Negative:
- Requires a two-step handshake (Request URLs $\rightarrow$ Upload $\rightarrow$ Confirm).
