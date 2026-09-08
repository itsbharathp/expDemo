---

description: "Task list for Corporate Expense Reimbursement & Policy Engine"
---

# Tasks: Corporate Expense Reimbursement & Policy Engine

**Input**: Design documents from `specs/001-expense-reimbursement-engine/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story. Tests are NOT included (not requested in spec).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

## Path Conventions

Web application layout: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create directory structure: `backend/`, `frontend/`, `backend/src/`, `backend/tests/`, `frontend/src/`, `frontend/tests/`
- [ ] T002 Initialize Python project in `backend/` with `pyproject.toml` (FastAPI 0.111, SQLAlchemy 2.x, Alembic, httpx, pytest)
- [ ] T003 Initialize TypeScript/React 18 project in `frontend/` with `package.json` (React Router 6, React Query, Vitest, React Testing Library)
- [ ] T004 [P] Create `docker-compose.yml` at repo root with backend, frontend, and PostgreSQL 16 services
- [ ] T005 [P] Create `.env.example` at repo root documenting all required environment variables (DB URL, secret key, SMTP settings)
- [ ] T006 [P] Configure linting and formatting: `ruff` in `backend/pyproject.toml`, ESLint + Prettier in `frontend/.eslintrc.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Create Alembic migration environment in `backend/src/db/` and initial migration script `backend/src/db/migrations/versions/001_initial_schema.py` with all tables (expense_claims, expense_categories, policy_rules, violation_flags, approval_decisions, notifications) and their downgrade steps
- [ ] T008 Create SQLAlchemy base model and session factory in `backend/src/db/session.py`
- [ ] T009 [P] Create `ExpenseCategory` ORM model in `backend/src/models/expense_category.py` (id, name, spending_cap, receipt_exemption_threshold, is_active)
- [ ] T010 [P] Create `PolicyRule` ORM model in `backend/src/models/policy_rule.py` (id, rule_type enum, name, threshold_value, enforcement_action enum, category_id FK, is_enabled, updated_at)
- [ ] T011 [P] Create `User` read-only integration model in `backend/src/models/user.py` (id, name, role enum, manager_id, department — sourced from JWT claims, not DB-managed)
- [ ] T012 Create FastAPI app entry point in `backend/src/main.py` with CORS middleware, versioned router prefix `/api/v1/`, and global exception handlers
- [ ] T013 Implement JWT authentication middleware in `backend/src/api/deps.py` — validate bearer token, extract user role and id, inject as dependency into route handlers
- [ ] T014 [P] Create React app entry point in `frontend/src/main.tsx` with React Router 6 routes and React Query `QueryClientProvider`
- [ ] T015 [P] Implement API client with auth token header injection in `frontend/src/services/api.ts`
- [ ] T016 Implement role-based route guards in `frontend/src/services/auth.ts` — redirect unauthorized roles to their appropriate landing page

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Submit an Expense Claim (Priority: P1) 🎯 MVP

**Goal**: An employee can submit an expense claim; the system validates it against all policy
rules and either auto-approves it (≤$50, all checks pass) or routes it for manager review.

**Independent Test**: Submit a $20 meal expense with a receipt on a weekday via the form.
Confirm the system auto-approves it (below $25 meal cap, below $50 global threshold) and shows
a confirmation with a reference number — no manager action required.

### Implementation for User Story 1

- [ ] T017 [P] [US1] Create `ExpenseClaim` ORM model in `backend/src/models/expense_claim.py` (id, employee_id, amount, currency, expense_date, category_id FK, merchant_name, receipt_path, status enum, submitted_at, reviewed_by, reviewed_at, parent_claim_id FK)
- [ ] T018 [P] [US1] Create `ViolationFlag` ORM model in `backend/src/models/violation_flag.py` (id, claim_id FK, rule_id FK, status enum, raised_at, resolved_by, resolved_at, resolution_note)
- [ ] T019 [US1] Implement `PolicyEngineService` in `backend/src/services/policy_engine.py` — evaluates a claim against all enabled PolicyRules in order: spending_cap → receipt_required → weekend_policy → duplicate_detection → auto_approve_threshold; caches rules in process memory, invalidates when `policy_rules.updated_at` changes (satisfies SC-007)
- [ ] T020 [US1] Implement `ClaimService.submit_claim()` in `backend/src/services/claim_service.py` — validate inputs, call PolicyEngineService, set claim status (`approved` or `pending_review`), create ViolationFlag records for any triggered rules, return claim with status
- [ ] T021 [US1] Add receipt file upload handler in `backend/src/services/receipt_store.py` — accept JPEG/PNG/PDF ≤10 MB, save to configured volume path, return stored path; reject corrupt/unreadable files with descriptive error
- [ ] T022 [US1] Implement `POST /api/v1/claims` route in `backend/src/api/claims.py` — accept multipart form (claim fields + receipt file), call ClaimService.submit_claim(), return claim id and status; enforce employee role
- [ ] T023 [US1] Implement `GET /api/v1/claims/{claim_id}` route in `backend/src/api/claims.py` — return claim detail for the authenticated employee who owns it
- [ ] T024 [P] [US1] Create claim submission form page in `frontend/src/pages/employee/SubmitClaimPage.tsx` — fields: amount, category (dropdown), expense date, merchant name, receipt upload; show validation errors inline
- [ ] T025 [P] [US1] Create `useSubmitClaim` React Query mutation hook in `frontend/src/services/claims.ts` — POST to `/api/v1/claims`, handle multipart encoding, return claim status
- [ ] T026 [US1] Create claim confirmation component in `frontend/src/components/ClaimConfirmation.tsx` — display reference number and status (auto-approved or pending review) after successful submission
- [ ] T027 [US1] Wire submission form → mutation hook → confirmation in `frontend/src/pages/employee/SubmitClaimPage.tsx`; display policy rejection reasons inline when backend returns 422

**Checkpoint**: User Story 1 fully functional — employee can submit, system validates and auto-approves or routes; confirmation displayed

---

## Phase 4: User Story 2 — Manager Reviews a Flagged Claim (Priority: P2)

**Goal**: A manager can view their review queue, open a claim with policy flags highlighted,
and approve or reject it with an optional comment.

**Independent Test**: Log in as a manager. Open the review queue and find the $500 travel claim
from US1. Approve it. Confirm the claim status updates to "Approved" and the employee receives
an in-app notification — without needing the auditor flow.

### Implementation for User Story 2

- [ ] T028 [P] [US2] Create `ApprovalDecision` ORM model in `backend/src/models/approval_decision.py` (id, claim_id FK, actor_id, action enum, note, decided_at)
- [ ] T029 [P] [US2] Create `Notification` ORM model in `backend/src/models/notification.py` (id, recipient_id, claim_id FK, event_type enum, message, is_read, created_at)
- [ ] T030 [US2] Implement `ClaimService.get_manager_queue()` in `backend/src/services/claim_service.py` — return claims in `pending_review` status assigned to the requesting manager (respects FR-014: manager ≠ claimant)
- [ ] T031 [US2] Implement `ClaimService.decide_claim()` in `backend/src/services/claim_service.py` — accept approve/reject + optional note, create ApprovalDecision record, update claim status, trigger notification
- [ ] T032 [US2] Implement `NotificationService.send()` in `backend/src/services/notification_service.py` — create in-app Notification record; if SMTP configured, dispatch email via FastAPI BackgroundTasks
- [ ] T033 [US2] Implement `GET /api/v1/manager/claims` route in `backend/src/api/manager.py` — return pending review queue for authenticated manager; enforce manager role
- [ ] T034 [US2] Implement `POST /api/v1/manager/claims/{claim_id}/decision` route in `backend/src/api/manager.py` — accept `{"action": "approved"|"rejected", "note": "..."}`, call ClaimService.decide_claim()
- [ ] T035 [US2] Implement `GET /api/v1/notifications` route in `backend/src/api/notifications.py` — return unread notifications for authenticated employee; `PATCH /api/v1/notifications/{id}/read` to mark read
- [ ] T036 [P] [US2] Create manager review queue page in `frontend/src/pages/manager/ReviewQueuePage.tsx` — list pending claims with policy violation badges, sorted by submission date
- [ ] T037 [P] [US2] Create claim detail view for managers in `frontend/src/pages/manager/ClaimDetailPage.tsx` — show all claim fields, violation flags highlighted, approve/reject form with optional comment field
- [ ] T038 [US2] Create notification bell component in `frontend/src/components/NotificationBell.tsx` — poll `GET /api/v1/notifications` every 30 seconds, show unread count badge, mark as read on click
- [ ] T039 [US2] Add notification bell to shared app layout in `frontend/src/components/AppLayout.tsx`

**Checkpoint**: User Stories 1 and 2 complete — full claim lifecycle from submission through manager decision functional

---

## Phase 5: User Story 3 — Weekend Policy Enforcement (Priority: P2)

**Goal**: Any claim with a weekend expense date is automatically flagged and routed for mandatory
manager review, regardless of amount. A pre-approved exception bypasses this.

**Independent Test**: Submit a $15 meal expense (below auto-approve threshold) with a Saturday
date. Confirm the system routes it to the manager queue with a weekend-policy flag — the
employee cannot submit without acknowledgement, and auto-approval does not trigger.

### Implementation for User Story 3

- [ ] T040 [US3] Add `WeekendPolicyRule` evaluation to `PolicyEngineService` in `backend/src/services/policy_engine.py` — check if `expense_date` is Saturday or Sunday in org timezone; if so, set enforcement_action to `require_review` and create ViolationFlag (FR-007); check for valid pre-approved exception before flagging
- [ ] T041 [US3] Create `WeekendException` ORM model in `backend/src/models/weekend_exception.py` (id, employee_id, date_from, date_to, approved_by, created_at) and add to migration in `backend/src/db/migrations/versions/002_weekend_exceptions.py`
- [ ] T042 [US3] Implement `GET /api/v1/admin/weekend-exceptions` and `POST /api/v1/admin/weekend-exceptions` routes in `backend/src/api/admin.py` — allow admins to create pre-approved exceptions; enforce admin role
- [ ] T043 [US3] Update submission form in `frontend/src/pages/employee/SubmitClaimPage.tsx` — display inline weekend-policy warning banner when selected expense date is a Saturday or Sunday, before form submission
- [ ] T044 [US3] Verify weekend flag appears in manager claim detail view in `frontend/src/pages/manager/ClaimDetailPage.tsx` — weekend policy flag must be prominently displayed with the expense date (may require no code change if flag rendering is already generic)

**Checkpoint**: Weekend policy enforced at submission; exceptions manageable by admin

---

## Phase 6: User Story 4 — Audit Dashboard & Violation Flagging (Priority: P3)

**Goal**: A compliance auditor can view all violation-flagged claims, mark any for investigation
(locking it), or clear a flag with a mandatory explanatory note.

**Independent Test**: Log in as an auditor. Open the audit dashboard and see the weekend-flagged
claim from US3. Mark it for investigation. Confirm the claim is locked (manager cannot approve
or reject it). Then clear the flag with a note. Confirm the claim returns to normal processing.

### Implementation for User Story 4

- [ ] T045 [US4] Implement `AuditService.get_flagged_claims()` in `backend/src/services/audit_service.py` — return all claims with active ViolationFlags, filterable by violation type, date range, employee id
- [ ] T046 [US4] Implement `AuditService.investigate_claim()` and `AuditService.clear_flag()` in `backend/src/services/audit_service.py` — set ViolationFlag status to `under_investigation` (locks claim) or `cleared` (requires non-empty resolution_note); create ApprovalDecision record for each auditor action
- [ ] T047 [US4] Enforce claim lock in `ClaimService.decide_claim()` in `backend/src/services/claim_service.py` — reject manager approve/reject actions if any ViolationFlag on the claim is `under_investigation` (FR-012)
- [ ] T048 [US4] Implement `GET /api/v1/audit/claims` route in `backend/src/api/audit.py` — return flagged claims with filter params (`violation_type`, `date_from`, `date_to`, `employee_id`); enforce auditor role
- [ ] T049 [US4] Implement `POST /api/v1/audit/claims/{claim_id}/investigate` and `POST /api/v1/audit/claims/{claim_id}/clear` routes in `backend/src/api/audit.py`
- [ ] T050 [P] [US4] Create audit dashboard page in `frontend/src/pages/auditor/AuditDashboardPage.tsx` — table of flagged claims with violation type badges, filter controls (type, date range, employee)
- [ ] T051 [P] [US4] Create auditor claim detail page in `frontend/src/pages/auditor/AuditClaimDetailPage.tsx` — show claim fields, all violation flags with status, "Mark for Investigation" and "Clear Flag" action buttons; clear flag requires text input for resolution note
- [ ] T052 [US4] Update duplicate detection in `PolicyEngineService` in `backend/src/services/policy_engine.py` — query for existing claims with same employee_id, amount, and merchant_name within a 7-day window; flag both claims (FR-008)

**Checkpoint**: All four user stories complete — full feature functional end-to-end

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and hardening that affect multiple user stories

- [ ] T053 [P] Create admin policy configuration page in `frontend/src/pages/admin/PolicyConfigPage.tsx` — list and edit spending caps, auto-approve threshold, receipt-exemption thresholds, weekend-policy toggle (satisfies FR-015)
- [ ] T054 [P] Implement `GET /api/v1/admin/policy-rules`, `PATCH /api/v1/admin/policy-rules/{id}` routes in `backend/src/api/admin.py` — update rule threshold/enforcement_action; set `updated_at` on save to trigger cache invalidation in PolicyEngineService
- [ ] T055 Add global error boundary in `frontend/src/components/ErrorBoundary.tsx` and map backend 422 validation errors to user-friendly field-level messages in `frontend/src/services/api.ts`
- [ ] T056 [P] Add structured request logging middleware in `backend/src/main.py` — log method, path, status code, duration for every request
- [ ] T057 [P] Seed initial data script in `backend/src/db/seed.py` — create default expense categories (Meal cap $25, Travel, Accommodation, Other) and default policy rules (auto-approve $50, receipt exemption $0 for Meal)
- [ ] T058 Run quickstart.md validation scenarios end-to-end and resolve any gaps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2
- **US2 (Phase 4)**: Depends on Phase 2; integrates with US1 claim records
- **US3 (Phase 5)**: Depends on Phase 2; extends PolicyEngineService from US1 (T019)
- **US4 (Phase 6)**: Depends on Phase 2; depends on ViolationFlag model from US1 (T018) and ClaimService.decide_claim from US2 (T031)
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Foundational — no story dependencies
- **US2 (P2)**: Can start after Foundational — reads claims created by US1 but is independently testable
- **US3 (P2)**: Can start after Foundational — extends PolicyEngineService; recommend completing US1 first since T040 modifies T019's service
- **US4 (P3)**: Recommend completing US1 and US2 first — uses ViolationFlag (US1) and claim lock (extends US2)

### Within Each User Story

- ORM models before services (services import models)
- Services before API routes (routes call services)
- Backend routes before frontend pages (pages call routes)
- Models marked [P] within a phase can be created in parallel

---

## Parallel Example: User Story 1

```
# Launch in parallel:
T017 Create ExpenseClaim ORM model       (backend/src/models/expense_claim.py)
T018 Create ViolationFlag ORM model      (backend/src/models/violation_flag.py)

# Then in parallel (after T017, T018):
T024 Create SubmitClaimPage              (frontend/src/pages/employee/)
T025 Create useSubmitClaim hook          (frontend/src/services/claims.ts)

# Sequential (after T017-T018):
T019 → T020 → T021 → T022 → T023       (policy engine → claim service → receipt store → routes)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Submit a $20 meal claim with receipt — confirm auto-approval confirmation
5. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → skeleton running
2. US1 → employee can submit, system validates and auto-approves (MVP demo-able)
3. US2 → manager review queue and approval/rejection live
4. US3 → weekend policy enforced at submission
5. US4 → auditor dashboard and investigation workflow
6. Polish → admin config UI, logging, seed data

### Parallel Team Strategy

With two or more developers after Phase 2 completes:
- Developer A: US1 (backend models + policy engine + submission API)
- Developer B: US1 frontend (submission form + confirmation)
- After US1: Developer A takes US2/US3 backend; Developer B takes US2/US3 frontend

---

## Notes

- [P] tasks operate on different files with no inter-task dependencies within the same phase
- Each user story phase is independently deployable and testable
- Constitution Principle III (Test-First) applies: tests must be authored and fail before implementation if added
- Commit after each task or logical group; stop at any checkpoint to validate independently
- T040 modifies T019's service file — coordinate if parallelizing US1 and US3
