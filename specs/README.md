# Feature & Bug Specifications Index

This directory contains feature specifications and bug reports following the spec-driven development workflow.

## Quick Links

- [Workflow Guide](#workflow-guide)
- [Feature List](#feature-list)
- [Bug List](#bug-list)

## Workflow Guide

### Spec-Driven Development Workflow

1. **Spec** - Create feature specification or bug report in `spec.md`
2. **Plan** - Create implementation plan or fix plan in `plan.md`
3. **Tasks** - Break down into tasks in `tasks.md`
4. **Implement** - Execute tasks following the plan

### Feature Status

- `draft` - Specification is being written
- `planned` - Spec approved, plan and tasks ready
- `in-progress` - Implementation has started
- `completed` - Feature is fully implemented and tested

### Bug Status

- `reported` - Bug has been reported
- `investigating` - Root cause analysis in progress
- `fixing` - Fix implementation in progress
- `testing` - Fix is being tested
- `resolved` - Bug is fixed and verified

## Feature List

| ID                                          | Feature Name                                                                                     | Status      | Phase                                                                     | Owner            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------- | ---------------- |
| `001-curl-import-export`                    | [curl-import-export](specs/001-curl-import-export/spec.md)                                       | `completed` | Phase 3: Import/Export & Interoperability (plan-timeline.md)              | Development Team |
| `002-environment-inheritance-and-overrides` | [environment-inheritance-and-overrides](specs/002-environment-inheritance-and-overrides/spec.md) | `completed` | Phase 2: Essential Features (plan-timeline.md)                            | Development Team |
| `003-performance-optimization-lazy-loading` | [performance-optimization-lazy-loading](specs/003-performance-optimization-lazy-loading/spec.md) | `completed` | Phase 4: Advanced Features - Performance Optimizations (plan-timeline.md) | Development Team |
| `004-reusable-click-outside-hook`           | [reusable-click-outside-hook](specs/004-reusable-click-outside-hook/spec.md)                     | `completed` | Phase 2: Code Duplication Consolidation (Medium Impact)                   | Development Team |
| `006-dialog-backdrop-consolidation`         | [dialog-backdrop-consolidation](specs/006-dialog-backdrop-consolidation/spec.md)                 | `completed` | Phase 2: Code Duplication Consolidation (Medium Impact)                   | Development Team |
| `007-form-validation-consolidation`         | [form-validation-consolidation](specs/007-form-validation-consolidation/spec.md)                 | `completed` | Phase 2: Code Duplication Consolidation (Medium Impact)                   | Development Team |
| `008-comprehensive-test-suite`              | [comprehensive-test-suite](specs/008-comprehensive-test-suite/spec.md)                           | `completed` | Infrastructure & Quality Assurance                                        | Development Team |
| `010-vscode-style-sidebar`                  | [vscode-style-sidebar](specs/010-vscode-style-sidebar/spec.md)                                   | `completed` | Phase 1 - Core UI Improvements                                            | Development Team |
| `011-response-tab-redesign`                 | [response-tab-redesign](specs/011-response-tab-redesign/spec.md)                                 | `completed` | Phase 2 - Core Features Enhancement                                       | Development Team |
| `012-ui-design-system-alignment`            | [ui-design-system-alignment](specs/012-ui-design-system-alignment/spec.md)                       | `planned`   | [UI & DX polish phase in `plan-timeline.md` – to be finalized]            | [TBD]            |

## Bug List

| ID                                    | Bug Name                                                                         | Status     | Severity | Priority | Related Feature                                                                     | Assignee         |
| ------------------------------------- | -------------------------------------------------------------------------------- | ---------- | -------- | -------- | ----------------------------------------------------------------------------------- | ---------------- |
| `bug-001-z-index-fixes`               | [z-index-fixes](specs/bug-001-z-index-fixes/spec.md)                             | `resolved` | `high`   | `P1`     | N/A (Infrastructure/UI Fix)                                                         | Development Team |
| `bug-002-variable-context-menu-fixes` | [variable-context-menu-fixes](specs/bug-002-variable-context-menu-fixes/spec.md) | `resolved` | `medium` | `P1`     | `specs/005-variable-input-consolidation/` (Variable Input Components Consolidation) | Development Team |
| `bug-003-sidebar-collection-collapse` | [sidebar-collection-collapse](specs/bug-003-sidebar-collection-collapse/spec.md) | `resolved` | `medium` | `P2`     | Collections Management (Phase 2)                                                    | Development Team |

## Creating Items

### Creating a New Feature

To create a new feature, run:

```bash
./scripts/create-feature.sh <feature-name>
```

### Creating a New Bug Report

To create a new bug report, run:

```bash
./scripts/create-bug.sh <bug-name>
```

## Updating the Index

To update this index after creating or modifying features/bugs:

```bash
./scripts/update-feature-index.sh
```

## Integration with plan-timeline.md

Features should be linked to phases in `plan-timeline.md`. When creating a feature:

1. Reference the phase in the spec.md `Phase` field
2. Update plan-timeline.md when the feature is completed

Bug fixes can be linked to maintenance phases in plan-timeline.md.
