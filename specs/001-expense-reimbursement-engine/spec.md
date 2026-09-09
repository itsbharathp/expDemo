# Feature Specification: Corporate Expense Reimbursement & Policy Engine

**Feature Branch**: `001-expense-reimbursement-engine`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Build a Corporate Expense Reimbursement & Policy Engine for employees. Validate claims against company caps, receipt rules, and weekend policies. Auto-approve safe low-value claims and flag audit violations."

## Clarifications

### Session 2026-09-08

- Q: What is the spending cap and receipt rule for the Meal expense category? → A: Meal cap is $25; a receipt is required for all meal claims regardless of amount.
- Q: What dollar amount should serve as the global auto-approve threshold? → A: $50.

### Session 2026-09-08 (Issue #59 — Frontend Redesign)

- Q: Should the redesign use Claude design token CSS variables directly or hardcoded hex values? → A: Define a theme.css with Claude tokens as CSS custom properties with hardcoded hex defaults — works standalone and is portable.
- Q: Should the redesign support dark mode or light mode only? → A: Light mode only for this pass; add TODO comment in theme.css for future dark mode.
- Q: Should inline styles be replaced with CSS classes or kept as hybrid? → A: Full CSS class replacement — one styles.css per component, inline only for computed/dynamic values.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit an Expense Claim (Priority: P1)

An employee submits an expense claim by providing the amount, category, date, and attaching a
receipt. The system validates the claim against policy rules and either auto-approves it (if
safe and below the low-value threshold) or routes it for manager review.

**Why this priority**: Core value of the product — without claim submission and basic policy
validation, no other story is meaningful.

**Independent Test**: An employee can submit a meal expense of $18 with a receipt (required for
all meal claims). The system auto-approves it instantly (below the $25 meal cap) and the employee
sees a confirmation. Fully demonstrable without manager or auditor flows.

**Acceptance Scenarios**:

1. **Given** a logged-in employee, **When** they submit a $20 meal expense with a valid receipt
   on a weekday, **Then** the system auto-approves the claim and displays a confirmation with a
   reference number (meal cap is $25; receipt required for all meal claims).
2. **Given** a logged-in employee, **When** they submit a $500 travel expense on a weekday with
   a valid receipt, **Then** the system routes the claim to their manager for review (exceeds the
   $50 auto-approve threshold).
3. **Given** a logged-in employee, **When** they submit a claim without attaching a receipt and
   the amount exceeds the receipt-exemption threshold, **Then** the system rejects the submission
   and prompts the employee to attach a receipt.
4. **Given** a logged-in employee, **When** they submit a claim with an amount that exceeds the
   category spending cap, **Then** the system rejects the claim and displays the applicable cap
   and the overage amount.

---

### User Story 2 - Manager Reviews a Flagged Claim (Priority: P2)

A manager reviews expense claims that were routed for approval because they exceeded the
auto-approve threshold or triggered a policy warning. The manager can approve or reject each
claim with an optional comment.

**Why this priority**: Completes the approval lifecycle for non-trivial claims; essential for
corporate workflow adoption.

**Independent Test**: A manager can view a list of pending claims, open one, see the policy
flags, and approve or reject it. The employee receives a status update. Testable independently
of the auditor flow.

**Acceptance Scenarios**:

1. **Given** a manager with pending claims, **When** they open the review queue, **Then** they
   see all claims awaiting their decision with policy violations highlighted.
2. **Given** a manager reviewing a claim, **When** they approve it, **Then** the claim status
   updates to "Approved" and the employee is notified.
3. **Given** a manager reviewing a claim, **When** they reject it with a reason, **Then** the
   claim status updates to "Rejected", the employee is notified with the reason, and the claim
   may be resubmitted with corrections.

---

### User Story 3 - Weekend Policy Enforcement (Priority: P2)

The system applies stricter rules (or blocks reimbursement entirely) for expenses incurred on
weekends unless a pre-approved exception exists. Claims with weekend dates are flagged
automatically.

**Why this priority**: A named policy requirement; must be enforced at submission time to prevent
policy violations from reaching the approval queue unchecked.

**Independent Test**: Submit a $30 meal expense (above the $25 meal cap) dated on a Saturday.
The system first rejects the claim due to the meal cap violation before the weekend policy even
applies, and displays the cap and overage to the employee.

**Acceptance Scenarios**:

1. **Given** an employee submitting a claim with a weekend date, **When** the claim has no
   pre-approved exception, **Then** the system applies a weekend flag and routes the claim for
   mandatory manager review regardless of amount.
2. **Given** an employee submitting a claim with a weekend date, **When** a valid pre-approved
   exception exists for that employee and date range, **Then** the claim is processed under
   standard weekday rules.
3. **Given** a manager reviewing a weekend-flagged claim, **When** they view the claim detail,
   **Then** the weekend policy flag is prominently displayed with the expense date.

---

### User Story 4 - Audit Dashboard & Violation Flagging (Priority: P3)

A finance/compliance auditor views claims that have been flagged for potential policy violations
(e.g., duplicate submissions, patterns of weekend spending, claims near the cap limit). The
auditor can mark items for investigation or clear them.

**Why this priority**: Provides the compliance and oversight capability; important but not
blocking for core employee and manager flows.

**Independent Test**: An auditor can open the violation dashboard and see all flagged claims with
the specific rule triggered. They can mark one for investigation. Fully testable without
changing any employee or manager functionality.

**Acceptance Scenarios**:

1. **Given** an auditor logged in, **When** they open the audit dashboard, **Then** they see all
   claims carrying a violation flag, categorized by violation type.
2. **Given** a claim that is a suspected duplicate (same employee, same amount, same merchant
   within 7 days), **When** the second claim is submitted, **Then** both claims are
   automatically flagged for audit review.
3. **Given** an auditor reviewing a flagged claim, **When** they mark it for investigation,
   **Then** the claim is locked from approval/rejection until the investigation is resolved.
4. **Given** an auditor who clears a flag, **When** they mark a flagged claim as cleared with a
   note, **Then** the claim returns to normal processing and the clearance note is retained for
   record.

---

### Edge Cases

- What happens when an employee submits a claim in a category that has no configured cap?
  (Assumed: system applies a global default cap; see Assumptions.)
- How does the system handle claims submitted retroactively for dates more than 90 days in the
  past? (Assumed: claims older than 90 days are automatically rejected with a message.)
- What if a manager is also the expense claimant (self-approval risk)? (Assumed: claims must be
  reviewed by a manager other than the claimant; system enforces this.)
- What happens when a receipt file is attached but is unreadable or corrupt?
- What if the auto-approve threshold and category cap overlap (e.g., cap is $30, auto-approve is
  $50)? (Assumed: the lower bound wins; the cap is always enforced.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow an authenticated employee to submit an expense claim with: amount,
  currency, expense date, category, merchant name, and an attached receipt image or PDF.
- **FR-002**: System MUST validate each submitted claim against: (a) category spending caps,
  (b) receipt-attachment rules, (c) weekend date policy, and (d) duplicate-submission detection.
- **FR-003**: System MUST auto-approve claims that satisfy all policy rules AND have an amount at
  or below $50 (the global auto-approve threshold). Claims above $50 MUST be routed for manager
  review even if no other policy rule is triggered.
- **FR-004**: System MUST route claims that exceed $50 (the auto-approve threshold), trigger a
  weekend flag, or carry any policy warning to the employee's assigned manager for review.
- **FR-005**: System MUST reject claims that exceed a category spending cap and display the cap
  amount and overage to the employee before submission is accepted. The Meal category cap is $25.
- **FR-006**: System MUST require a receipt attachment for any claim above the receipt-exemption
  threshold; claims below that threshold MAY be submitted without a receipt. All Meal category
  claims MUST include a receipt regardless of amount (no receipt exemption applies to Meal claims).
- **FR-007**: System MUST flag any claim with an expense date falling on Saturday or Sunday with
  a weekend-policy violation and require manager approval regardless of amount.
- **FR-008**: System MUST detect suspected duplicate claims (same employee, same amount, same
  merchant name within a 7-day window) and flag both claims for audit review.
- **FR-009**: System MUST allow a manager to approve or reject any claim in their review queue,
  with an optional free-text comment on rejection.
- **FR-010**: System MUST notify the employee by in-app notification (and email, if configured)
  when their claim status changes to Approved, Rejected, or Flagged.
- **FR-011**: System MUST provide an audit dashboard showing all claims carrying an active
  violation flag, filterable by violation type, date range, and employee.
- **FR-012**: System MUST allow an auditor to mark a flagged claim for investigation (locking it
  from approval/rejection) or to clear the flag with a mandatory explanatory note.
- **FR-013**: System MUST reject claims with an expense date more than 90 days prior to the
  submission date.
- **FR-014**: System MUST prevent an employee's own manager from being the same person as the
  claimant; if no eligible reviewer exists, the claim is escalated to a secondary approver.
- **FR-015**: Spending caps, auto-approve thresholds, receipt-exemption thresholds, and
  weekend-policy settings MUST be configurable by a system administrator without a code change.

### Key Entities

- **Expense Claim**: A single reimbursement request from an employee. Key attributes: id,
  employee, amount, currency, category, expense date, merchant, receipt attachment, status,
  policy flags, submission timestamp.
- **Policy Rule**: A named, configurable rule (e.g., "Meal Cap", "Weekend Policy"). Attributes:
  rule type, category scope, threshold value, enforcement action (reject / flag / require-review).
- **Employee**: A system user who submits claims. Attributes: id, name, assigned manager,
  department.
- **Manager**: A system user who reviews and approves/rejects claims routed to them.
- **Auditor**: A finance/compliance role that reviews violation-flagged claims and manages
  investigations.
- **Violation Flag**: A record attached to a claim indicating which policy rule was triggered and
  the current resolution state (active, under investigation, cleared).
- **Approval Decision**: A manager's or auditor's action on a claim — approve, reject, or
  investigate — with timestamp and optional note.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Employees can submit a complete expense claim in under 2 minutes from start to
  confirmation.
- **SC-002**: 100% of submitted claims are evaluated against all configured policy rules before
  reaching any human reviewer.
- **SC-003**: Auto-approved claims receive a status confirmation within 5 seconds of submission.
- **SC-004**: Managers can review, approve, or reject a queued claim in under 3 minutes with all
  policy context visible on a single screen.
- **SC-005**: Zero policy-violating claims are auto-approved (auto-approval is only available
  when all policy checks pass and the amount is at or below the configured threshold).
- **SC-006**: All audit-flagged claims appear in the auditor dashboard within 60 seconds of the
  flag being raised.
- **SC-007**: Policy rule changes (caps, thresholds) take effect for all new claim submissions
  within 1 minute of an administrator saving the change, with no system restart required.

## Assumptions

- An authentication and user-management system already exists; this feature integrates with it
  and does not build its own login or user-provisioning flows.
- Employees have a single assigned manager in the existing system; the manager relationship is
  readable by this feature.
- The initial release supports a single currency per organization; multi-currency support is
  out of scope for v1.
- Receipt attachments are image files (JPEG, PNG) or PDFs; maximum file size is 10 MB per
  attachment.
- The default global category cap (for categories without a specific cap configured) is set by
  the administrator during initial setup.
- Email notifications are optional and depend on an email service being configured by the
  administrator; in-app notifications are always provided.
- "Weekend" is defined as Saturday and Sunday in the organization's configured time zone.
- A claim older than 90 days (by expense date) cannot be submitted; this threshold is not
  configurable in v1.
- Mobile support is out of scope for v1; the product targets web browsers on desktop.
