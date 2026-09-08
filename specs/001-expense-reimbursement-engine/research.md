# Research: Corporate Expense Reimbursement & Policy Engine

**Date**: 2026-09-08 | **Feature**: 001-expense-reimbursement-engine

## Backend Framework

**Decision**: Python 3.12 + FastAPI 0.111
**Rationale**: FastAPI auto-generates OpenAPI specs from type annotations, which satisfies the
constitution's API-contract requirement with minimal overhead. Python 3.12 is the current stable
LTS release. FastAPI's async support handles concurrent claim submissions cleanly.
**Alternatives considered**: Django REST Framework (heavier, more convention-over-config than
needed for this scope); Flask (no built-in validation/serialization); Node/Express (team context
favors Python per no stated preference — Python chosen for backend ML/data affinity common in
finance tooling).

## Frontend Framework

**Decision**: React 18 + TypeScript + React Query
**Rationale**: React 18 is the current stable release with strong ecosystem support. TypeScript
adds compile-time safety for the API contract shapes. React Query manages server state (claim
lists, policy rules) without over-engineering global state management.
**Alternatives considered**: Vue 3 (equally valid, no project preference stated); plain
fetch + useState (insufficient for cache invalidation needed by manager review queue).

## Storage

**Decision**: PostgreSQL 16
**Rationale**: Financial audit trails require ACID guarantees. Policy rules, claims, and
violation flags are naturally relational (foreign keys, joins for audit queries). PostgreSQL's
row-level locking supports the "lock claim under investigation" requirement (FR-012).
**Alternatives considered**: MySQL 8 (equally viable; PostgreSQL preferred for JSON column
support in policy rule configuration); SQLite (not suitable for concurrent multi-user access).

## Policy Rule Evaluation

**Decision**: In-process rule engine (no external rules service)
**Rationale**: The spec defines a fixed, configurable rule set (cap check, receipt check,
weekend check, duplicate check). A dedicated rules engine (Drools, OPA) would be premature
abstraction (Constitution Principle IV). Rules are evaluated as an ordered pipeline of
strategy objects, each returning pass/flag/reject. Config values loaded from DB, cached in
process memory, invalidated on admin save (satisfies SC-007 ≤60s propagation).
**Alternatives considered**: OPA/Rego (powerful but over-engineered for 4 rule types); stored
procedures (couples logic to DB, harder to test).

## Receipt File Storage

**Decision**: Local filesystem (Docker volume) for v1; path stored in DB
**Rationale**: Keeps the v1 stack simple (Constitution Principle IV). The storage path is
abstracted behind a `ReceiptStore` interface so a future migration to S3/GCS is a one-file
change.
**Alternatives considered**: S3 from day one (unnecessary external dependency for a v1 demo
deployment; adds IAM complexity).

## Authentication / Authorization

**Decision**: Integrate with existing auth system via JWT bearer tokens; roles encoded in token
claims (employee / manager / auditor / admin)
**Rationale**: The spec Assumptions state an existing auth/user-management system exists. The
backend validates JWTs on every request; no separate auth service is built. Role-based access
control (RBAC) is enforced at the API router layer.
**Alternatives considered**: Session cookies (viable for browser-only use; JWT chosen for
statelessness and easier integration with existing system).

## Notification Delivery

**Decision**: In-app notifications stored in DB + optional email via SMTP (configurable)
**Rationale**: FR-010 requires in-app notifications always; email is conditional on admin
configuration. A simple notifications table with a background task (FastAPI BackgroundTasks)
handles delivery without requiring a message queue in v1.
**Alternatives considered**: WebSocket push (adds complexity; polling every 30s is sufficient
for claim status updates in a corporate tool); Celery/Redis (over-engineered for v1 notification
volume).

## Testing Strategy

**Decision**: pytest + httpx for backend; Vitest + React Testing Library for frontend
**Rationale**: pytest is the Python standard; httpx's async ASGI transport allows testing
FastAPI endpoints without a running server. Vitest is Jest-compatible and significantly faster.
RTL tests components from the user's perspective, aligning with the spec's acceptance scenarios.
**Alternatives considered**: unittest (verbose); Jest (slower cold start than Vitest).

## Duplicate Detection Window

**Decision**: 7-day rolling window (same employee, same amount, same merchant name)
**Rationale**: Defined explicitly in FR-008. No further research needed.

## Claim Lifecycle States

**Decision** (from pending clarification Q2, answered as B):
`Submitted → Pending Review → Approved / Rejected → Resubmitted`
Five states total. Rejected claims may be corrected and resubmitted; a resubmitted claim
re-enters the Submitted state and is re-evaluated from scratch.
**Note**: Q2 was interrupted by `/speckit-plan` invocation. Defaulting to Option B (the
recommended answer) per the clarification session context.
