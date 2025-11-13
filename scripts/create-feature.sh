#!/bin/bash

# Create Feature Script
# Creates a new feature directory structure following spec-kit conventions

set -e

FEATURE_NAME="$1"

if [ -z "$FEATURE_NAME" ]; then
    echo "Usage: ./scripts/create-feature.sh <feature-name>"
    echo "Example: ./scripts/create-feature.sh curl-import-export"
    exit 1
fi

# Convert feature name to kebab-case if needed
FEATURE_NAME=$(echo "$FEATURE_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

# Find the next feature number
LAST_NUM=$(ls -1 specs/ 2>/dev/null | grep -E '^[0-9]{3}-' | sort -n | tail -1 | cut -d'-' -f1 || echo "000")
NEXT_NUM=$(printf "%03d" $((10#$LAST_NUM + 1)))

FEATURE_DIR="specs/${NEXT_NUM}-${FEATURE_NAME}"

if [ -d "$FEATURE_DIR" ]; then
    echo "Error: Feature directory already exists: $FEATURE_DIR"
    exit 1
fi

echo "Creating feature: $FEATURE_DIR"

# Create directory structure
mkdir -p "$FEATURE_DIR/contracts"

# Copy templates
cp templates/spec-template.md "$FEATURE_DIR/spec.md"
cp templates/plan-template.md "$FEATURE_DIR/plan.md"
cp templates/tasks-template.md "$FEATURE_DIR/tasks.md"
cp templates/contract-template.json "$FEATURE_DIR/contracts/api-spec.json"

# Replace placeholders in spec.md
sed -i '' "s/\[Feature Name\]/$FEATURE_NAME/g" "$FEATURE_DIR/spec.md"
sed -i '' "s/XXX-feature-name/${NEXT_NUM}-${FEATURE_NAME}/g" "$FEATURE_DIR/spec.md"
sed -i '' "s/\[Date\]/$(date +%Y-%m-%d)/g" "$FEATURE_DIR/spec.md"

# Replace placeholders in plan.md
sed -i '' "s/\[Feature Name\]/$FEATURE_NAME/g" "$FEATURE_DIR/plan.md"
sed -i '' "s/XXX-feature-name/${NEXT_NUM}-${FEATURE_NAME}/g" "$FEATURE_DIR/plan.md"

# Replace placeholders in tasks.md
sed -i '' "s/\[Feature Name\]/$FEATURE_NAME/g" "$FEATURE_DIR/tasks.md"
sed -i '' "s/XXX-feature-name/${NEXT_NUM}-${FEATURE_NAME}/g" "$FEATURE_DIR/tasks.md"

# Replace placeholders in api-spec.json
sed -i '' "s/\[Feature Name\]/$FEATURE_NAME/g" "$FEATURE_DIR/contracts/api-spec.json"
sed -i '' "s/XXX-feature-name/${NEXT_NUM}-${FEATURE_NAME}/g" "$FEATURE_DIR/contracts/api-spec.json"
sed -i '' "s/\[Date\]/$(date +%Y-%m-%d)/g" "$FEATURE_DIR/contracts/api-spec.json"

# Create data-model.md placeholder
cat > "$FEATURE_DIR/contracts/data-model.md" <<EOF
# Data Model: $FEATURE_NAME

**Feature ID**: ${NEXT_NUM}-${FEATURE_NAME}

## Overview

[Describe the data model for this feature]

## Schema

\`\`\`typescript
// TypeScript interfaces/types
\`\`\`

## Database Schema

[If applicable, describe database schema changes]

## Validation Rules

- [ ] Rule 1
- [ ] Rule 2

EOF

echo "Feature created successfully: $FEATURE_DIR"
echo ""
echo "Next steps:"
echo "1. Edit $FEATURE_DIR/spec.md to define the feature specification"
echo "2. Edit $FEATURE_DIR/plan.md to create the implementation plan"
echo "3. Edit $FEATURE_DIR/tasks.md to break down tasks"
echo "4. Update specs/README.md to add this feature to the index"

