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
rg 'fetch\(|axios\.' src --type ts -l 2>/dev/null || echo "none"
rg 'cogniteapi\.omnia|api\.cognitedata|\.fusion\.cognite' src --type ts -l 2>/dev/null || echo "none"

echo ""
echo "=== DMS list patterns ==="
echo "list() calls:"; rg '\.list\(' src --type ts -c 2>/dev/null || echo "0"
echo "limit clauses:"; rg '\blimit:' src --type ts -c 2>/dev/null || echo "0"
echo "cursor usage:";  rg 'cursor|nextCursor' src --type ts -c 2>/dev/null || echo "0"

echo ""
echo "=== Testability ==="
echo "vi.mock:";         rg 'vi\.mock\(' src --type ts -c 2>/dev/null || echo "0"
echo "useContext:";      rg 'useContext.*Context\b' src --type ts -c 2>/dev/null || echo "0"
echo "as unknown as:";   rg 'as unknown as ' src --type ts -c 2>/dev/null || echo "0"

echo ""
echo "=== Dead code / console ==="
rg 'TODO|FIXME|HACK|console\.log' src --type ts -c 2>/dev/null || echo "0"
echo "TS files total:"; find src -name '*.ts' -o -name '*.tsx' 2>/dev/null | wc -l
