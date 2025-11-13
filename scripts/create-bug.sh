#!/bin/bash

# Create Bug Script
# Creates a new bug directory structure following spec-kit conventions

set -e

BUG_NAME="$1"

if [ -z "$BUG_NAME" ]; then
    echo "Usage: ./scripts/create-bug.sh <bug-name>"
    echo "Example: ./scripts/create-bug.sh collection-crash-on-delete"
    exit 1
fi

# Convert bug name to kebab-case if needed
BUG_NAME=$(echo "$BUG_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

# Find the next bug number
LAST_NUM=$(ls -1 specs/ 2>/dev/null | grep -E '^bug-[0-9]{3}-' | sort -n | tail -1 | sed 's/bug-\([0-9]\{3\}\)-.*/\1/' || echo "000")
NEXT_NUM=$(printf "%03d" $((10#$LAST_NUM + 1)))

BUG_DIR="specs/bug-${NEXT_NUM}-${BUG_NAME}"

if [ -d "$BUG_DIR" ]; then
    echo "Error: Bug directory already exists: $BUG_DIR"
    exit 1
fi

echo "Creating bug: $BUG_DIR"

# Create directory structure
mkdir -p "$BUG_DIR/contracts"

# Copy templates
cp templates/bug-template.md "$BUG_DIR/spec.md"
cp templates/plan-template.md "$BUG_DIR/plan.md"
cp templates/tasks-template.md "$BUG_DIR/tasks.md"
cp templates/contract-template.json "$BUG_DIR/contracts/api-spec.json" 2>/dev/null || true

# Replace placeholders in spec.md
sed -i '' "s/\[Bug Name\]/$BUG_NAME/g" "$BUG_DIR/spec.md"
sed -i '' "s/bug-XXX-bug-name/bug-${NEXT_NUM}-${BUG_NAME}/g" "$BUG_DIR/spec.md"
sed -i '' "s/\[Date\]/$(date +%Y-%m-%d)/g" "$BUG_DIR/spec.md"

# Replace placeholders in plan.md
sed -i '' "s/\[Feature Name\]/$BUG_NAME (Bug Fix)/g" "$BUG_DIR/plan.md"
sed -i '' "s/XXX-feature-name/bug-${NEXT_NUM}-${BUG_NAME}/g" "$BUG_DIR/plan.md"

# Replace placeholders in tasks.md
sed -i '' "s/\[Feature Name\]/$BUG_NAME (Bug Fix)/g" "$BUG_DIR/tasks.md"
sed -i '' "s/XXX-feature-name/bug-${NEXT_NUM}-${BUG_NAME}/g" "$BUG_DIR/tasks.md"

# Replace placeholders in api-spec.json if it exists
if [ -f "$BUG_DIR/contracts/api-spec.json" ]; then
    sed -i '' "s/\[Feature Name\]/$BUG_NAME/g" "$BUG_DIR/contracts/api-spec.json"
    sed -i '' "s/XXX-feature-name/bug-${NEXT_NUM}-${BUG_NAME}/g" "$BUG_DIR/contracts/api-spec.json"
    sed -i '' "s/\[Date\]/$(date +%Y-%m-%d)/g" "$BUG_DIR/contracts/api-spec.json"
fi

# Create data-model.md placeholder
cat > "$BUG_DIR/contracts/data-model.md" <<EOF
# Data Model: $BUG_NAME (Bug Fix)

**Bug ID**: bug-${NEXT_NUM}-${BUG_NAME}

## Overview

[Describe any data model changes needed for this bug fix]

## Schema Changes

[If applicable, describe schema changes]

## Validation Rules

- [ ] Rule 1
- [ ] Rule 2

EOF

echo "Bug created successfully: $BUG_DIR"
echo ""
echo "Next steps:"
echo "1. Edit $BUG_DIR/spec.md to fill in bug details (reproduction steps, expected/actual behavior)"
echo "2. Edit $BUG_DIR/plan.md to create the fix plan and root cause analysis"
echo "3. Edit $BUG_DIR/tasks.md to break down fix tasks"
echo "4. Update specs/README.md by running: ./scripts/update-feature-index.sh"

