#!/usr/bin/env bash
# Run all Q1–Q10 design-review probes and print structured output.
# Usage: bash .agents/skills/flows-design-review/scripts/probes.sh

set -u

echo "=== Q1 Aura ==="
grep -rlE '#[0-9a-fA-F]{3,8}' --include='*.css' --include='*.tsx' --include='*.ts' src 2>/dev/null || echo "none"
grep -rlE '\b(rgb|rgba|hsl|hsla)\(' --include='*.tsx' --include='*.css' src 2>/dev/null || echo "none"
echo "aura dep:"; grep -c '@cognite/aura' package.json 2>/dev/null || echo "0"

echo ""
echo "=== Q2 Navigation ==="
grep -rcE '<Route\b' --include='*.tsx' src 2>/dev/null | grep -v ':0' || echo "0"
grep -rlE 'Breadcrumb' --include='*.tsx' src 2>/dev/null || echo "none"
grep -rlE '<Topbar|<Sidebar|<Header' --include='*.tsx' src 2>/dev/null || echo "none"

echo ""
echo "=== Q3 Labels ==="
grep -rcE '>(Submit|OK|Click here|Go|Yes|No)<' --include='*.tsx' src 2>/dev/null | grep -v ':0' || echo "0"
echo "placeholders:"; grep -rcE 'placeholder=' --include='*.tsx' src 2>/dev/null | grep -v ':0' | wc -l

echo ""
echo "=== Q4 Feedback ==="
grep -rlE 'isLoading|isPending|<Skeleton|<Loader|<Spinner' --include='*.tsx' src 2>/dev/null || echo "none"
grep -rlE 'isError|onError|<Alert|toast\.' --include='*.tsx' src 2>/dev/null || echo "none"
grep -rlE 'useMutation' --include='*.tsx' src 2>/dev/null || echo "none"

echo ""
echo "=== Q5 Clickability ==="
echo "div onClick:";  grep -rcE '<div[^>]*onClick' --include='*.tsx' src 2>/dev/null | grep -v ':0' | wc -l
echo "span onClick:"; grep -rcE '<span[^>]*onClick' --include='*.tsx' src 2>/dev/null | grep -v ':0' | wc -l
echo "hover/focus:";  grep -rlE 'hover:|focus:' --include='*.tsx' src 2>/dev/null | wc -l

echo ""
echo "=== Q6 Error prevention ==="
grep -rilE 'delete|remove|archive|reset' --include='*.tsx' src 2>/dev/null | head -20 || echo "none"
grep -rlE 'AlertDialog|ConfirmDialog|window\.confirm' --include='*.tsx' src 2>/dev/null || echo "none"

echo ""
echo "=== Q7 Responsive ==="
echo "responsive utils:"; grep -rlE '\b(sm|md|lg|xl|2xl):' --include='*.tsx' src 2>/dev/null | wc -l
echo "fixed px:";         grep -rlE '\bw-\[[0-9]+px\]|\bh-\[[0-9]+px\]' --include='*.tsx' src 2>/dev/null | wc -l

echo ""
echo "=== Q8 Empty states ==="
grep -rilE 'empty|no[[:space:]]+(data|results|items)' --include='*.tsx' src 2>/dev/null || echo "none"
grep -rlE '<EmptyState|EmptyPlaceholder' --include='*.tsx' src 2>/dev/null || echo "none"
echo "length===0:"; grep -rcE 'items\.length === 0' --include='*.tsx' src 2>/dev/null | grep -v ':0' | wc -l

echo ""
echo "=== Q9 Performance ==="
find dist -maxdepth 1 -newer package.json -name '*.js' 2>/dev/null | wc -l
du -sh dist/ 2>/dev/null || echo "no dist"
echo "code-split:"; grep -rlE 'React\.lazy|lazy\(' --include='*.tsx' src 2>/dev/null | wc -l

echo ""
echo "=== Q10 Accessibility ==="
echo "img tags:";       grep -rcE '<img\b' --include='*.tsx' src 2>/dev/null | grep -v ':0' | wc -l
echo "img with alt:";   grep -rcE '<img[^>]*alt=' --include='*.tsx' src 2>/dev/null | grep -v ':0' | wc -l
echo "icon buttons:";   grep -rcE '<button[^>]*>[[:space:]]*<(svg|Icon)' --include='*.tsx' src 2>/dev/null | grep -v ':0' | wc -l
echo "aria-label:";     grep -rcE 'aria-label=' --include='*.tsx' src 2>/dev/null | grep -v ':0' | wc -l
echo "focus styles:";   grep -rlE 'focus-visible:|focus:' --include='*.tsx' src 2>/dev/null | wc -l
