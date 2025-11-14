# AI Context Files

This directory contains centralized context files that guide AI-assisted development in Anayas. These files ensure consistent, performance-first development aligned with the project goals.

## Files

### `/ai-context/project-goal.md`
**Purpose**: Defines the primary mission, success metrics, and performance targets.

**Key Content:**
- Primary mission: Developer-oriented, blazing fast, low-memory Postman alternative
- Performance budgets (memory, bundle size, load time)
- Feature development rules
- Performance-first mindset

**When to Read:**
- Before starting any feature
- When making architectural decisions
- When evaluating feature proposals

### `/ai-context/architecture.md`
**Purpose**: Documents architecture patterns, code organization, and performance strategies.

**Key Content:**
- Core principles (separation, type safety, performance)
- File organization
- Communication patterns
- Performance-first architecture (lazy loading, code splitting, memory management)
- Code patterns and anti-patterns

**When to Read:**
- When planning feature implementation
- When making architectural decisions
- When reviewing code

### `/ai-context/example-quality.md`
**Purpose**: Provides code quality examples and performance patterns.

**Key Content:**
- Good patterns (lazy loading, memory management, cleanup)
- Bad patterns (anti-patterns to avoid)
- Performance tracking examples
- Component, service, and hook patterns

**When to Read:**
- When implementing features
- When reviewing code
- When learning project patterns

### `/ai-context/common-utils.md`
**Purpose**: Documents reusable utilities and when to use them.

**Key Content:**
- Renderer utilities (`src/lib/`)
- Main process utilities (`electron/services/`)
- Database utilities
- React hooks
- When to create new vs reuse

**When to Read:**
- Before creating new utilities
- When looking for existing functionality
- When planning feature implementation

### `/ai-context/performance-tracking.md`
**Purpose**: Guide for tracking performance metrics.

**Key Content:**
- Performance budgets
- How to track features
- Integration examples
- Best practices

**When to Read:**
- When implementing performance tracking
- When debugging performance issues
- When reviewing performance metrics

## Workflow Integration

These files are integrated into the development workflow:

1. **SPEC Phase**: Read `project-goal.md` and `architecture.md`
2. **PLAN Phase**: Read `example-quality.md` and `common-utils.md`
3. **IMPLEMENT Phase**: Reference all files as needed

See `.cursorrules` for the complete goal-aware workflow.

## Updating Context Files

When updating these files:
1. Keep them aligned with actual codebase
2. Update examples when patterns change
3. Document new utilities in `common-utils.md`
4. Update performance budgets in `project-goal.md` if targets change

## References

- `.cursorrules` - Goal-aware workflow
- `templates/spec-template.md` - Feature spec template
- `templates/plan-template.md` - Implementation plan template
- `src/lib/performance.ts` - Performance tracking utility

