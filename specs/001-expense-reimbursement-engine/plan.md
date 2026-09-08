# Implementation Plan: Corporate Expense Reimbursement & Policy Engine

**Branch**: `001-expense-reimbursement-engine` | **Date**: 2026-09-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-expense-reimbursement-engine/spec.md`

## Summary

Build a web-based Corporate Expense Reimbursement & Policy Engine that allows employees to
submit expense claims, validates them against configurable policy rules (category caps, receipt
requirements, weekend policy, duplicate detection), auto-approves safe low-value claims (≤$50),
routes the rest for manager review, and provides an audit dashboard for compliance officers to
manage violation flags.

The system is a full-stack web application: a Python/FastAPI REST backend with PostgreSQL
storage and a React frontend, deployable as a Docker-composed service pair.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript / React 18 (frontend)

**Primary Dependencies**: FastAPI 0.111, SQLAlchemy 2.x, Alembic (migrations); React 18,
React Router 6, React Query (frontend state)

**Storage**: PostgreSQL 16 — ACID compliance required for financial audit trails; relational
model fits policy rules and claim lifecycle naturally

**Testing**: pytest + httpx (backend API tests), Vitest + React Testing Library (frontend)

**Target Platform**: Linux server (Docker Compose); desktop web browser (Chrome/Firefox/Safari
latest 2 versions)

**Project Type**: Web application (REST API backend + SPA frontend)

**Performance Goals**: Auto-approval response ≤5 seconds end-to-end (SC-003); claim submission
form completes in ≤2 minutes user time (SC-001); audit dashboard loads flagged claims within
60 seconds of flag creation (SC-006)

**Constraints**: Policy rule changes must propagate to new submissions within 60 seconds
(SC-007, no restart); single currency per org (v1); no mobile support (v1); receipt files
≤10 MB (JPEG, PNG, PDF)

**Scale/Scope**: Org-scale deployment; assumes hundreds of employees, tens of managers, a small
auditor team; not designed for multi-tenant SaaS in v1

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-First Development | PASS | Spec completed and clarified before this plan |
| II. Incremental, Task-Driven Delivery | PASS | tasks.md will decompose into single-session tasks |
| III. Test-First Quality | PASS | TDD enforced; tests written before implementation per workflow |
| IV. Simplicity and YAGNI | PASS | No speculative features; multi-currency, mobile, multi-tenant deferred |
| V. Security by Default | PASS | Input validation at API boundary; RBAC enforced; no secrets in VCS |
| Technical Standards — API contracts | PASS | Contracts defined in Phase 1 before implementation |
| Technical Standards — Reversible migrations | PASS | Alembic with downgrade steps required |
| Technical Standards — Env config | PASS | All connection strings and secrets via env vars |

**Post-Phase-1 re-check**: All gates remain PASS after design artifacts produced (no new
violations introduced by data model or contract decisions).

## Project Structure

### Documentation (this feature)

```text
specs/001-expense-reimbursement-engine/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── claims.md
│   ├── policy-rules.md
│   └── audit.md
└── tasks.md             # Phase 2 output (speckit-tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/          # SQLAlchemy ORM models
│   ├── services/        # Policy engine, claim workflow, notification
│   ├── api/             # FastAPI routers (claims, policy, audit, auth)
│   └── db/              # Alembic migrations, session management
└── tests/
    ├── unit/            # Service-layer unit tests
    └── integration/     # API endpoint tests (real DB via test container)

frontend/
├── src/
│   ├── components/      # Shared UI components
│   ├── pages/           # Employee, Manager, Auditor, Admin views
│   └── services/        # API client, auth hooks
└── tests/               # Vitest + React Testing Library
```

**Structure Decision**: Web application (Option 2) — separate `backend/` and `frontend/`
directories. The backend exposes a versioned REST API (`/api/v1/`); the frontend is a SPA that
consumes it. This separation allows independent deployment and testing of each layer.

## Complexity Tracking

No constitution violations requiring justification. All design choices are the minimum needed
to satisfy the spec.
