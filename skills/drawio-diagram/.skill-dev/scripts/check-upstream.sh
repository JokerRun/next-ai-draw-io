#!/bin/bash
# check-upstream.sh
# Check if upstream project has updates that may require skill sync

set -e

SKILL_DIR="skills/drawio-diagram"
VERSION_LOCK="$SKILL_DIR/.skill-dev/VERSION_LOCK.md"

# Get last sync commit
LAST_SYNC=$(grep "Commit:" "$VERSION_LOCK" | head -1 | awk '{print $2}')

if [ -z "$LAST_SYNC" ]; then
    echo "❌ Could not find last sync commit in VERSION_LOCK.md"
    exit 1
fi

echo "📋 Last sync commit: $LAST_SYNC"
echo ""

# Fetch upstream
echo "🔄 Fetching upstream..."
git fetch upstream 2>/dev/null || {
    echo "⚠️  Could not fetch upstream. Make sure 'upstream' remote is configured."
    exit 1
}

# Key files to check
FILES=(
    "lib/system-prompts.ts"
    "lib/utils.ts"
    "app/api/chat/route.ts"
    "app/api/chat/xml_guide.md"
)

echo ""
echo "📁 Checking key files for changes since $LAST_SYNC..."
echo ""

CHANGES_FOUND=0

for file in "${FILES[@]}"; do
    # Check if file has changes
    DIFF_STAT=$(git diff "$LAST_SYNC"..upstream/main --stat -- "$file" 2>/dev/null | tail -1)
    
    if [ -n "$DIFF_STAT" ] && [[ "$DIFF_STAT" != *"0 insertions"* || "$DIFF_STAT" != *"0 deletions"* ]]; then
        echo "⚠️  $file"
        echo "   $DIFF_STAT"
        CHANGES_FOUND=1
    else
        echo "✅ $file (no changes)"
    fi
done

echo ""

if [ $CHANGES_FOUND -eq 1 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚠️  Upstream has changes that may require skill sync!"
    echo ""
    echo "Next steps:"
    echo "  1. Review changes: git diff $LAST_SYNC..upstream/main -- <file>"
    echo "  2. Check SOURCE_MAP.md for affected skill files"
    echo "  3. Update skill files as needed"
    echo "  4. Update VERSION_LOCK.md and CHANGELOG.md"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "✅ No changes detected in key files. Skill is up to date!"
fi
