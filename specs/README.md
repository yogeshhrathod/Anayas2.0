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

| ID | Feature Name | Status | Phase | Owner |
|----|--------------|--------|-------|-------|
| `001-curl-import-export` | [curl-import-export](specs/001-curl-import-export/spec.md) | `completed` | Phase 3: Import/Export & Interoperability (plan-timeline.md) | Development Team |

## Bug List

*No bugs yet. Use `./scripts/create-bug.sh <bug-name>` to create your first bug report.*

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

