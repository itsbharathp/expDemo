<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0
Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (I–V)
  - Technical Standards
  - Development Workflow
  - Governance
Removed sections: N/A
Follow-up TODOs:
  - RATIFICATION_DATE set to 2026-09-08 (today, first adoption)
-->

# Demo Project Constitution

## Core Principles

### I. Spec-First Development
All features MUST begin with a written specification in `.specify/` before any implementation
begins. No code is written without an approved spec. The spec is the source of truth; the
implementation follows the spec, not the other way around.

### II. Incremental, Task-Driven Delivery
Every feature MUST be broken down into discrete, dependency-ordered tasks before implementation.
Tasks MUST be completable in a single focused session. Large features MUST be decomposed rather
than shipped as a monolith.

### III. Test-First Quality (NON-NEGOTIABLE)
Tests MUST be written and reviewed before implementation code is written (TDD). The Red–Green–
Refactor cycle is strictly enforced. No feature is considered complete without passing tests
covering its acceptance criteria.

### IV. Simplicity and YAGNI
Code MUST solve the stated requirement and nothing more. Abstractions are introduced only when
a concrete, present need justifies them. Speculative generalization, premature optimization, and
unused scaffolding are prohibited. Three similar lines are preferable to a premature abstraction.

### V. Security by Default
User input MUST be validated and sanitized at system boundaries. SQL injection, XSS, and other
OWASP Top 10 vulnerabilities MUST be avoided. Secrets MUST NOT be committed to version control.
Dependencies MUST be reviewed for known vulnerabilities before adoption.

## Technical Standards

- **Language and framework** choices MUST be documented in the relevant feature spec before use.
- **API contracts** (request/response shapes, error formats) MUST be defined in the spec and
  remain stable across minor versions.
- **Database migrations** MUST be reversible and reviewed before merging.
- **Dependency additions** require explicit justification in the PR/commit description.
- All **environment configuration** MUST be managed via environment variables, never hardcoded.

## Development Workflow

1. Spec is authored and approved via `/speckit-specify`.
2. Implementation plan is generated via `/speckit-plan`.
3. Tasks are generated and ordered via `/speckit-tasks`.
4. Implementation proceeds task-by-task via `/speckit-implement`.
5. Each completed feature is reviewed against its spec via `/speckit-converge` before merging.
6. No step may be skipped. If a step produces unclear output, it MUST be resolved before
   advancing.

## Governance

This constitution supersedes all informal conventions and verbal agreements. Amendments require:
1. A written rationale explaining what changes and why.
2. A version bump following semantic versioning (MAJOR for removals/redefinitions, MINOR for
   additions, PATCH for clarifications).
3. The amended constitution written to `.specify/memory/constitution.md`.
4. A commit message of the form `docs: amend constitution to vX.Y.Z (<summary>)`.

All code reviews and spec reviews MUST verify compliance with this constitution. Complexity that
cannot be justified against the principles MUST be refactored or rejected.

**Version**: 1.0.0 | **Ratified**: 2026-09-08 | **Last Amended**: 2026-09-08
