# Quickstart Validation Guide

**Feature**: Corporate Expense Reimbursement & Policy Engine
**Date**: 2026-09-08

## Prerequisites

1. Copy `.env.example` to `.env` and set `SECRET_KEY`
2. Run `docker compose up -d` to start PostgreSQL, backend, and frontend
3. Run Alembic migrations: `docker compose exec backend alembic -c src/db/alembic.ini upgrade head`
4. Seed data: `docker compose exec backend python -m backend.src.db.seed`

## Scenario 1: Auto-Approval (US1 — P1)

**Setup**: Generate a JWT with role=employee
**Steps**:
1. POST /api/v1/claims with amount=20, category=Meal, expense_date=<weekday>, merchant_name="Cafe", receipt=<file>

**Expected**: Response status=approved, HTTP 200

## Scenario 2: Manager Review (US1+US2)

**Steps**:
1. POST /api/v1/claims with amount=500, category=Travel, expense_date=<weekday>, receipt=<file>
   **Expected**: Response status=pending_review
2. As manager: GET /api/v1/manager/claims → see the claim
3. POST /api/v1/manager/claims/{id}/decision with action=approved
   **Expected**: Claim status=approved, notification created for employee

## Scenario 3: Weekend Policy (US3)

**Steps**:
1. POST /api/v1/claims with amount=15, category=Meal, expense_date=<Saturday>, receipt=<file>

**Expected**: Response status=pending_review, ViolationFlag with rule_type=weekend_policy

## Scenario 4: Audit Investigation (US4)

**Steps**:
1. As auditor: GET /api/v1/audit/claims → see flagged claims
2. POST /api/v1/audit/claims/{id}/investigate
   **Expected**: flag status=under_investigation
3. As manager: POST /api/v1/manager/claims/{id}/decision → expect 409 "locked under investigation"
4. As auditor: POST /api/v1/audit/claims/{id}/clear with resolution_note="Verified"
   **Expected**: flag status=cleared, claim returns to pending_review

## Scenario 5: Policy Cap Rejection (US1)

**Steps**:
1. POST /api/v1/claims with amount=30, category=Meal (cap=$25), receipt=<file>

**Expected**: HTTP 422 with message about meal cap exceeded

## Validation: All Scenarios Pass ✓

---

## Issue #59 — Frontend Redesign Validation

### Prerequisites

- Backend running: `PYTHONPATH=. .venv/bin/uvicorn backend.src.main:app --port 8000`
- Frontend running: `cd frontend && npm run dev`
- Open http://localhost:5173

### Visual Checklist

| Check | Expected |
|---|---|
| Page background | Warm off-white `#FAF9F5` (not white, not grey) |
| Card surfaces | Pure white `#FFFFFF` with `border-radius: 8px` and `shadow-sm` |
| Primary text | Near-black `#141413` |
| Secondary/label text | Dark grey `#3D3D3A` |
| Primary button | Inverse black background `#141413`, white text, 8px radius |
| Header bar | Inverse black `#141413` (not blue) |
| Status badge: approved | Green bg `#E9F1DC`, green text `#265B19` |
| Status badge: rejected | Red bg `#F7ECEC`, red text `#7F2C28` |
| Status badge: pending | Warning bg `#F6EEDF`, warning text `#5A4815` |
| Status badge: auto_approved | Green (same as approved) |
| Font family | Anthropic Sans / system-ui (not system blue) |
| Heading size | 20px / 600 weight |
| Body text | 16px / 400 weight |
| Caption/meta text | 14px / 400 weight |
| No inline style attrs | DevTools Elements panel shows CSS classes, not `style=""` on structural elements |

### Scenario: Login Page

1. Open http://localhost:5173 (unauthenticated → redirects to `/login`)
2. Verify: warm background, centered card, JWT paste area, 4 demo user buttons
3. Click "Alice — Employee" → redirects to `/employee/submit`

### Scenario: Submit Claim Page

1. Logged in as Alice
2. Verify: form in a white card, labeled inputs, category dropdown shows real names + caps
3. Submit a valid claim → see confirmation with green success badge

### Scenario: Manager Review Queue

1. Sign out, log in as Bob Manager → redirects to `/manager/queue`
2. Verify: list of pending claims, status badges, claim rows have visible hierarchy

### Scenario: Audit Dashboard

1. Sign out, log in as Carol Auditor → redirects to `/auditor/dashboard`
2. Verify: violation flag badges use correct semantic colours

### Scenario: Admin Policy Config

1. Sign out, log in as Dave Admin → redirects to `/admin/policy`
2. Verify: policy rules in a table/list, editable fields, save button
