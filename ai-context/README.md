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

### `/ai-context/test-suite-guide.md`

**Purpose**: Comprehensive guide for using the test suite with TDD/BDD approach.

**Key Content:**

- Test suite structure and statistics
- BDD (Behavior-Driven Development) patterns
- TDD (Test-Driven Development) workflow
- Test helpers and utilities reference
- Common test patterns
- How to write tests for new features

**When to Read:**

- Before implementing new features (to write tests first)
- When writing new IPC handlers (to follow patterns)
- When creating new components (to add integration tests)
- When debugging test failures
- When learning test patterns

## Workflow Integration

These files are integrated into the development workflow:

1. **SPEC Phase**: Read `project-goal.md` and `architecture.md`
   - Write acceptance criteria as BDD scenarios
   - Plan test coverage requirements
2. **PLAN Phase**: Read `example-quality.md`, `common-utils.md`, and `test-suite-guide.md`
   - Identify test files to create
   - Reference existing test patterns
   - Plan test data setup
3. **IMPLEMENT Phase**: Reference all files as needed
   - **Write tests first** (TDD) using `test-suite-guide.md`
   - Follow patterns from `example-quality.md`
   - Use utilities from `common-utils.md`
   - Run tests frequently to verify implementation

See `.cursorrules` for the complete goal-aware workflow.

## Updating Context Files

When updating these files:

1. Keep them aligned with actual codebase
2. Update examples when patterns change
3. Document new utilities in `common-utils.md`
4. Update performance budgets in `project-goal.md` if targets change

## References

- `.cursorrules` - Goal-aware workflow
- `.cursor/rules/test-driven-development.mdc` - TDD/BDD guidelines
- `templates/spec-template.md` - Feature spec template
- `templates/plan-template.md` - Implementation plan template
- `src/lib/performance.ts` - Performance tracking utility
- `specs/008-comprehensive-test-suite/` - Test suite specification
- `tests/integration/` - Test files and patterns
