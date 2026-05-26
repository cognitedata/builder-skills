#!/usr/bin/env bash
# Verify all certification artifacts are committed to git.
# Mirrors assertArtifactsCommitted from `npx @cognite/cli apps submit`.
# Exit 0 = all present and committed; exit 1 = one or more missing.
# Usage: bash .agents/skills/flows-external-app-submit/scripts/verify.sh

set -u

PASS=0  # 0 = all good, 1 = failures found

check() {
  local pattern=$1 label=$2 skill=$3
  if git ls-files -- "$pattern" | grep -q .; then
    printf "PASS  %s\n" "$label"
  else
    printf "FAIL  %-52s  → run /%s\n" "$label" "$skill"
    PASS=1
  fi
}

echo "Certification artifacts (git ls-files):"
check 'App-Brief.md' \
      'App-Brief.md' \
      'flows-app-brief'
check 'reviews/code-review/*/code-review-report.md' \
      'reviews/code-review/feedback-round-<N>/code-review-report.md' \
      'flows-code-review'
check 'reviews/design-review/*/design-review-report.md' \
      'reviews/design-review/feedback-round-<N>/design-review-report.md' \
      'flows-design-review'

echo ""
echo "Working tree:"
if git diff --quiet HEAD 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
  echo "PASS  clean"
else
  echo "FAIL  uncommitted changes — commit or stash before running apps submit"
  PASS=1
fi

echo ""
echo "Deploy bundle:"
if ls .cognite-bundles/*.zip 2>/dev/null | grep -q .; then
  echo "PASS  $(ls .cognite-bundles/*.zip 2>/dev/null | head -1)"
else
  echo "WARN  missing — run \`npx @cognite/cli apps deploy\` (apps submit will warn, not block)"
fi

exit $PASS
