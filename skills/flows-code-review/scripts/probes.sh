#!/usr/bin/env bash
# Run all code-review probes and print structured output.
# Usage: bash .agents/skills/flows-code-review/scripts/probes.sh

set -u

echo "=== Test coverage ==="
npx vitest run --coverage 2>&1 | tail -30 \
  || npx jest --coverage 2>&1 | tail -30 \
  || npm test -- --coverage 2>&1 | tail -30 \
  || echo "no test runner found"

echo ""
echo "=== Lint ==="
npm run lint 2>&1 | tail -20 || echo "no lint script"

echo ""
echo "=== TypeScript ==="
npx tsc --noEmit 2>&1 | tail -20 || echo "no tsconfig"

echo ""
echo "=== Dependency audit ==="
npm audit --json 2>/dev/null | head -150 || echo "no audit output"

echo ""
echo "=== Raw HTTP to CDF hosts ==="
grep -rlE 'fetch\(|axios\.' --include='*.ts' --include='*.tsx' src 2>/dev/null || echo "none"
grep -rlE 'cogniteapi\.omnia|api\.cognitedata|\.fusion\.cognite' --include='*.ts' --include='*.tsx' src 2>/dev/null || echo "none"

echo ""
echo "=== DMS list patterns ==="
echo "list() calls:";  grep -rlE '\.list\(' --include='*.ts' --include='*.tsx' src 2>/dev/null | wc -l
echo "limit clauses:"; grep -rlE '\blimit:' --include='*.ts' --include='*.tsx' src 2>/dev/null | wc -l
echo "cursor usage:";  grep -rlE 'cursor|nextCursor' --include='*.ts' --include='*.tsx' src 2>/dev/null | wc -l

echo ""
echo "=== Testability ==="
echo "vi.mock:";        grep -rlE 'vi\.mock\(' --include='*.ts' --include='*.tsx' src 2>/dev/null | wc -l
echo "useContext:";     grep -rlE 'useContext' --include='*.ts' --include='*.tsx' src 2>/dev/null | wc -l
echo "as unknown as:";  grep -rlE 'as unknown as ' --include='*.ts' --include='*.tsx' src 2>/dev/null | wc -l

echo ""
echo "=== Dead code / console ==="
grep -rlE 'TODO|FIXME|HACK|console\.log' --include='*.ts' --include='*.tsx' src 2>/dev/null | wc -l
echo "TS files total:"; find src \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null | wc -l
