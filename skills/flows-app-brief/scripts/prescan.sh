#!/usr/bin/env bash
# Pre-scan the repo to seed App-Brief.md fields before prompting.
# Outputs structured sections the coach reads silently.
# Usage: bash .agents/skills/flows-app-brief/scripts/prescan.sh

set -u

echo "=== app.json ==="
if [ -f app.json ]; then
  cat app.json
else
  echo "not found"
fi

echo ""
echo "=== package.json ==="
if [ -f package.json ]; then
  node -e "const p = require('./package.json'); console.log('name:', p.name); console.log('description:', p.description || '')" 2>/dev/null || cat package.json | head -10
else
  echo "not found"
fi

echo ""
echo "=== git owner / remote ==="
echo "name: $(git config user.name 2>/dev/null || echo '')"
echo "email: $(git config user.email 2>/dev/null || echo '')"
echo "remote: $(git config --get remote.origin.url 2>/dev/null || echo '')"

echo ""
echo "=== spec files ==="
find specs -name 'spec.md' 2>/dev/null | sort | head -5 | while read -r f; do
  echo "--- $f ---"
  head -60 "$f"
  echo ""
done || echo "none"

echo ""
echo "=== existing App-Brief.md ==="
if [ -f App-Brief.md ]; then
  cat App-Brief.md
else
  echo "not found"
fi
