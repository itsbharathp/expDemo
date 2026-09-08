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
