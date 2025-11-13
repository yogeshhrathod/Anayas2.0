#!/bin/bash

# Update Feature Index Script
# Generates/updates the feature and bug index in specs/README.md

set -e

README_FILE="specs/README.md"

echo "Updating feature and bug index..."

# Get all feature directories
FEATURES=$(ls -1 specs/ 2>/dev/null | grep -E '^[0-9]{3}-' | sort -n || echo "")

# Get all bug directories
BUGS=$(ls -1 specs/ 2>/dev/null | grep -E '^bug-[0-9]{3}-' | sort -n || echo "")

# Start building the index
INDEX_CONTENT="# Feature & Bug Specifications Index\n\n"
INDEX_CONTENT+="This directory contains feature specifications and bug reports following the spec-driven development workflow.\n\n"
INDEX_CONTENT+="## Quick Links\n\n"
INDEX_CONTENT+="- [Workflow Guide](#workflow-guide)\n"
INDEX_CONTENT+="- [Feature List](#feature-list)\n"
INDEX_CONTENT+="- [Bug List](#bug-list)\n\n"
INDEX_CONTENT+="## Workflow Guide\n\n"
INDEX_CONTENT+="### Spec-Driven Development Workflow\n\n"
INDEX_CONTENT+="1. **Spec** - Create feature specification or bug report in \`spec.md\`\n"
INDEX_CONTENT+="2. **Plan** - Create implementation plan or fix plan in \`plan.md\`\n"
INDEX_CONTENT+="3. **Tasks** - Break down into tasks in \`tasks.md\`\n"
INDEX_CONTENT+="4. **Implement** - Execute tasks following the plan\n\n"
INDEX_CONTENT+="### Feature Status\n\n"
INDEX_CONTENT+="- \`draft\` - Specification is being written\n"
INDEX_CONTENT+="- \`planned\` - Spec approved, plan and tasks ready\n"
INDEX_CONTENT+="- \`in-progress\` - Implementation has started\n"
INDEX_CONTENT+="- \`completed\` - Feature is fully implemented and tested\n\n"
INDEX_CONTENT+="### Bug Status\n\n"
INDEX_CONTENT+="- \`reported\` - Bug has been reported\n"
INDEX_CONTENT+="- \`investigating\` - Root cause analysis in progress\n"
INDEX_CONTENT+="- \`fixing\` - Fix implementation in progress\n"
INDEX_CONTENT+="- \`testing\` - Fix is being tested\n"
INDEX_CONTENT+="- \`resolved\` - Bug is fixed and verified\n\n"

# Feature List Section
INDEX_CONTENT+="## Feature List\n\n"

if [ -z "$FEATURES" ]; then
    INDEX_CONTENT+="*No features yet. Use \`./scripts/create-feature.sh <feature-name>\` to create your first feature.*\n\n"
else
    INDEX_CONTENT+="| ID | Feature Name | Status | Phase | Owner |\n"
    INDEX_CONTENT+="|----|--------------|--------|-------|-------|\n"
    
    # Process each feature
    for FEATURE_DIR in $FEATURES; do
        FEATURE_PATH="specs/$FEATURE_DIR"
        SPEC_FILE="$FEATURE_PATH/spec.md"
        
        if [ ! -f "$SPEC_FILE" ]; then
            continue
        fi
        
        # Extract feature name (remove number prefix)
        FEATURE_NAME=$(echo "$FEATURE_DIR" | sed 's/^[0-9]\{3\}-//')
        
        # Extract status from spec.md (look for Status: line)
        STATUS=$(grep -i "^\\*\\*Status\\*\\*" "$SPEC_FILE" 2>/dev/null | head -1 | sed 's/.*\*\*Status\*\*[: ]*//' | sed 's/|.*//' | tr -d '`' | xargs || echo "unknown")
        
        # Extract phase from spec.md
        PHASE=$(grep -i "^\\*\\*Phase\\*\\*" "$SPEC_FILE" 2>/dev/null | head -1 | sed 's/.*\*\*Phase\*\*[: ]*//' | xargs || echo "-")
        
        # Extract owner from spec.md
        OWNER=$(grep -i "^\\*\\*Owner\\*\\*" "$SPEC_FILE" 2>/dev/null | head -1 | sed 's/.*\*\*Owner\*\*[: ]*//' | xargs || echo "-")
        
        # Create markdown link
        INDEX_CONTENT+="| \`$FEATURE_DIR\` | [$FEATURE_NAME]($FEATURE_PATH/spec.md) | \`$STATUS\` | $PHASE | $OWNER |\n"
    done
    INDEX_CONTENT+="\n"
fi

# Bug List Section
INDEX_CONTENT+="## Bug List\n\n"

if [ -z "$BUGS" ]; then
    INDEX_CONTENT+="*No bugs yet. Use \`./scripts/create-bug.sh <bug-name>\` to create your first bug report.*\n\n"
else
    INDEX_CONTENT+="| ID | Bug Name | Status | Severity | Priority | Related Feature | Assignee |\n"
    INDEX_CONTENT+="|----|----------|--------|----------|----------|-----------------|----------|\n"
    
    # Process each bug
    for BUG_DIR in $BUGS; do
        BUG_PATH="specs/$BUG_DIR"
        SPEC_FILE="$BUG_PATH/spec.md"
        
        if [ ! -f "$SPEC_FILE" ]; then
            continue
        fi
        
        # Extract bug name (remove bug-XXX- prefix)
        BUG_NAME=$(echo "$BUG_DIR" | sed 's/^bug-[0-9]\{3\}-//')
        
        # Extract status from spec.md
        STATUS=$(grep -i "^\\*\\*Status\\*\\*" "$SPEC_FILE" 2>/dev/null | head -1 | sed 's/.*\*\*Status\*\*[: ]*//' | sed 's/|.*//' | tr -d '`' | xargs || echo "unknown")
        
        # Extract severity from spec.md
        SEVERITY=$(grep -i "^\\*\\*Severity\\*\\*" "$SPEC_FILE" 2>/dev/null | head -1 | sed 's/.*\*\*Severity\*\*[: ]*//' | sed 's/|.*//' | tr -d '`' | xargs || echo "-")
        
        # Extract priority from spec.md
        PRIORITY=$(grep -i "^\\*\\*Priority\\*\\*" "$SPEC_FILE" 2>/dev/null | head -1 | sed 's/.*\*\*Priority\*\*[: ]*//' | sed 's/|.*//' | tr -d '`' | xargs || echo "-")
        
        # Extract related feature from spec.md
        RELATED_FEATURE=$(grep -i "^\\*\\*Related Feature\\*\\*" "$SPEC_FILE" 2>/dev/null | head -1 | sed 's/.*\*\*Related Feature\*\*[: ]*//' | xargs || echo "-")
        
        # Extract assignee from spec.md
        ASSIGNEE=$(grep -i "^\\*\\*Assignee\\*\\*" "$SPEC_FILE" 2>/dev/null | head -1 | sed 's/.*\*\*Assignee\*\*[: ]*//' | xargs || echo "-")
        
        # Create markdown link
        INDEX_CONTENT+="| \`$BUG_DIR\` | [$BUG_NAME]($BUG_PATH/spec.md) | \`$STATUS\` | \`$SEVERITY\` | \`$PRIORITY\` | $RELATED_FEATURE | $ASSIGNEE |\n"
    done
    INDEX_CONTENT+="\n"
fi

# Add creation instructions
INDEX_CONTENT+="## Creating Items\n\n"
INDEX_CONTENT+="### Creating a New Feature\n\n"
INDEX_CONTENT+="To create a new feature, run:\n\n"
INDEX_CONTENT+="\`\`\`bash\n"
INDEX_CONTENT+="./scripts/create-feature.sh <feature-name>\n"
INDEX_CONTENT+="\`\`\`\n\n"
INDEX_CONTENT+="### Creating a New Bug Report\n\n"
INDEX_CONTENT+="To create a new bug report, run:\n\n"
INDEX_CONTENT+="\`\`\`bash\n"
INDEX_CONTENT+="./scripts/create-bug.sh <bug-name>\n"
INDEX_CONTENT+="\`\`\`\n\n"
INDEX_CONTENT+="## Updating the Index\n\n"
INDEX_CONTENT+="To update this index after creating or modifying features/bugs:\n\n"
INDEX_CONTENT+="\`\`\`bash\n"
INDEX_CONTENT+="./scripts/update-feature-index.sh\n"
INDEX_CONTENT+="\`\`\`\n\n"
INDEX_CONTENT+="## Integration with plan-timeline.md\n\n"
INDEX_CONTENT+="Features should be linked to phases in \`plan-timeline.md\`. When creating a feature:\n"
INDEX_CONTENT+="1. Reference the phase in the spec.md \`Phase\` field\n"
INDEX_CONTENT+="2. Update plan-timeline.md when the feature is completed\n\n"
INDEX_CONTENT+="Bug fixes can be linked to maintenance phases in plan-timeline.md.\n"

# Write to README
echo -e "$INDEX_CONTENT" > "$README_FILE"

FEATURE_COUNT=$(echo "$FEATURES" | wc -l | xargs || echo "0")
BUG_COUNT=$(echo "$BUGS" | wc -l | xargs || echo "0")

echo "Index updated: $README_FILE"
echo "Total features: $FEATURE_COUNT"
echo "Total bugs: $BUG_COUNT"

