#!/usr/bin/env bash
# Run all Q1–Q10 design-review probes and print structured output.
# Usage: bash .agents/skills/flows-design-review/scripts/probes.sh

set -u

echo "=== Q1 Aura ==="
rg '#[0-9a-fA-F]{3,8}\b' src --type css --type tsx --type ts -l 2>/dev/null || echo "none"
rg '\b(rgb|rgba|hsl|hsla)\(' src --type tsx --type css -l 2>/dev/null || echo "none"
echo "aura dep:"; grep -c '@cognite/aura' package.json 2>/dev/null || echo "0"

echo ""
echo "=== Q2 Navigation ==="
rg '<Route\b' src --type tsx -c 2>/dev/null || echo "0"
rg 'Breadcrumb' src --type tsx -l 2>/dev/null || echo "none"
rg '<Topbar|<Sidebar|<Header' src --type tsx -l 2>/dev/null || echo "none"

echo ""
echo "=== Q3 Labels ==="
rg '>(Submit|OK|Click here|Go|Yes|No)<' src --type tsx -c 2>/dev/null || echo "0"
echo "placeholders:"; rg 'placeholder=' src --type tsx -c 2>/dev/null || echo "0"

echo ""
echo "=== Q4 Feedback ==="
rg 'isLoading|isPending|<Skeleton|<Loader|<Spinner' src --type tsx -l 2>/dev/null || echo "none"
rg 'isError|onError|<Alert|toast\.' src --type tsx -l 2>/dev/null || echo "none"
rg 'useMutation' src --type tsx -l 2>/dev/null || echo "none"

echo ""
echo "=== Q5 Clickability ==="
echo "div onClick:";  rg '<div[^>]*onClick' src --type tsx -c 2>/dev/null || echo "0"
echo "span onClick:"; rg '<span[^>]*onClick' src --type tsx -c 2>/dev/null || echo "0"
echo "hover/focus:";  rg 'hover:|focus:' src --type tsx -c 2>/dev/null || echo "0"

echo ""
echo "=== Q6 Error prevention ==="
rg 'delete|remove|archive|reset' src --type tsx -i -l 2>/dev/null | head -20 || echo "none"
rg 'AlertDialog|ConfirmDialog|window\.confirm' src --type tsx -l 2>/dev/null || echo "none"

echo ""
echo "=== Q7 Responsive ==="
echo "responsive utils:"; rg '\b(sm|md|lg|xl|2xl):' src --type tsx -c 2>/dev/null || echo "0"
echo "fixed px:";         rg '\bw-\[[0-9]+px\]|\bh-\[[0-9]+px\]' src --type tsx -c 2>/dev/null || echo "0"

echo ""
echo "=== Q8 Empty states ==="
rg -i 'empty|no\s+(data|results|items)' src --type tsx -l 2>/dev/null || echo "none"
rg '<EmptyState|EmptyPlaceholder' src --type tsx -l 2>/dev/null || echo "none"
echo "length===0:"; rg 'items\.length === 0' src --type tsx -c 2>/dev/null || echo "0"

echo ""
echo "=== Q9 Performance ==="
find dist -maxdepth 1 -newer package.json -name '*.js' 2>/dev/null | wc -l
du -sh dist/ 2>/dev/null || echo "no dist"
echo "code-split:"; rg 'React\.lazy|lazy\(' src --type tsx -c 2>/dev/null || echo "0"

echo ""
echo "=== Q10 Accessibility ==="
echo "img without alt:"; rg '<img\b(?![^>]*\balt=)' src --type tsx -c 2>/dev/null || echo "0"
echo "icon buttons:";    rg '<button[^>]*>\s*<(svg|Icon)' src --type tsx -c 2>/dev/null || echo "0"
echo "aria-label:";      rg 'aria-label=' src --type tsx -c 2>/dev/null || echo "0"
echo "focus styles:";    rg 'focus-visible:|focus:' src --type tsx -c 2>/dev/null || echo "0"
