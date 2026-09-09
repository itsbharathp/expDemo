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

---

## Issue #59 — Frontend Redesign Research

### CSS Token Architecture

**Decision**: Single `frontend/src/theme.css` file defining all Claude design-system tokens as
CSS custom properties with hardcoded light-mode hex defaults. Imported once in `main.tsx`.
**Rationale**: Standalone Vite app cannot rely on the Claude host injecting `var(--color-*)` at
runtime. Defining the variables locally preserves token semantics (so future host injection just
works) while ensuring correct rendering today. Clarification Q1 answer B.
**Alternatives considered**: Tailwind config (adds build dependency); styled-components
(runtime CSS-in-JS overhead not needed for this scope); raw inline hex (no theming path).
**TODO**: Add `@media (prefers-color-scheme: dark)` overrides when dark mode is required
(clarification Q2 deferred to a future pass).

### Styling Architecture

**Decision**: One `styles.css` per component/page file, co-located alongside the `.tsx` file.
Inline `style={{}}` props only for computed/dynamic values (e.g., badge colors driven by status
enum). All structural, typographic, and spacing styles move to CSS classes.
**Rationale**: Clarification Q3 answer A. Keeps component files readable, enables browser
devtools inspection by class name, and removes the inline-style maintenance burden.
**Alternatives considered**: CSS Modules (scoping benefit not needed for this small app);
single global stylesheet (naming collision risk at scale).

### Claude Design Token Mapping to Components

**Decision**: Apply the following token mapping consistently across all pages:

| Element | Token | Light value |
|---|---|---|
| Page background | `--color-background-tertiary` | `#FAF9F5` |
| Card/panel background | `--color-background-primary` | `#FFFFFF` |
| Secondary surface | `--color-background-secondary` | `#F5F4ED` |
| Primary text | `--color-text-primary` | `#141413` |
| Secondary text | `--color-text-secondary` | `#3D3D3A` |
| Muted/caption text | `--color-text-tertiary` | `#73726C` |
| Primary border | `--color-border-primary` | `rgba(31,30,29,0.4)` |
| Tertiary border | `--color-border-tertiary` | `rgba(31,30,29,0.15)` |
| Primary button bg | `--color-background-inverse` | `#141413` |
| Primary button text | `--color-text-inverse` | `#FFFFFF` |
| Success bg | `--color-background-success` | `#E9F1DC` |
| Success text | `--color-text-success` | `#265B19` |
| Danger bg | `--color-background-danger` | `#F7ECEC` |
| Danger text | `--color-text-danger` | `#7F2C28` |
| Warning bg | `--color-background-warning` | `#F6EEDF` |
| Warning text | `--color-text-warning` | `#5A4815` |
| Info bg | `--color-background-info` | `#D6E4F6` |
| Info text | `--color-text-info` | `#3266AD` |

**Typography scale** (three-level, two-weight per guidelines):
- Heading: `font-heading-lg-size` (20px), `font-weight-semibold` (600)
- Body: `font-text-md-size` (16px), `font-weight-normal` (400)
- Caption: `font-text-sm-size` (14px), `font-weight-normal` (400)
- Font family: `"Anthropic Sans, system-ui, sans-serif"`

**Radius**: `border-radius-md` (8px) for cards/inputs/buttons; `border-radius-sm` (6px) for badges/chips; `border-radius-full` (9999px) for pill badges.

**Shadows**: `shadow-sm` for cards; `shadow-md` for dropdowns/modals.

### Component Inventory per Page

| Page | Key components needed |
|---|---|
| `AppLayout` | Header bar (inverse bg), nav user chip, sign-out button |
| `LoginPage` | Card, text inputs, primary button, demo-user list buttons |
| `SubmitClaimPage` | Form card, labeled inputs, select, file input, submit button, inline field errors, status badge (result) |
| `ReviewQueuePage` | Table/list of claim rows, status badge, action link |
| `ClaimDetailPage` (manager) | Detail card, policy-flag badge list, approve/reject buttons, textarea for note |
| `AuditDashboardPage` | Filterable table, violation-type badge, investigate/clear action buttons |
| `AuditClaimDetailPage` | Detail card, violation flag cards, action buttons |
| `PolicyConfigPage` | Settings table/form, editable threshold inputs, save button |
| `NotificationBell` | Icon button, unread count badge, dropdown panel (card) |
