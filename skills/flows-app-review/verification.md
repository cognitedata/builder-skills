# Flows App Review — Verification

You are a second pair of eyes. Do not trust the review at face value — verify claims by reading the actual source code.

---

## Step 1: Format compliance

### review-report.md
- [ ] Title: `# [App name] — Flows app review`
- [ ] "What this review covers" section present
- [ ] "Path to approval" with must-fix count + one sentence on should-fix
- [ ] Summary (2–4 sentences, positives first)
- [ ] Reviewed commit with SHA
- [ ] Test coverage section: Framework, Tests run, Coverage (or explanation), Notable gaps
- [ ] Package & security summary present
- [ ] Scores table has **all 12 criteria** (1.1–1.6, 2.1–2.5, 3.1)
- [ ] Must fix / Should fix / Nice to fix sections present
- [ ] Every must-fix item has an **`_Impact:_`** note
- [ ] Must-fix count in "Path to approval" matches actual must-fix items

### review-files.md
- [ ] All columns present: File, Structure, Quality, Patterns, Tests, Notes
- [ ] Every `.ts`/`.tsx` file in the app is listed (verify against actual file listing)
- [ ] Criterion refs in Notes where relevant
- [ ] Non-trivial files without tests marked `✗`
- [ ] Presentational-only components and barrel exports marked `N/A` for Tests

### review-packages.md
- [ ] All columns present: Package, Used version, Latest, Weekly downloads, Last published, Deprecated, CVEs, Health
- [ ] Every package from both `dependencies` and `devDependencies` listed
- [ ] Security audit summary table present
- [ ] Health summary with pass/warn/fail counts

---

## Step 2: Score accuracy

For each of the 12 criteria, verify the score matches the rubric in `scoring-criteria.md`:

- [ ] Does the Notes evidence support this score level?
- [ ] Is a score of 1–2 reflected as a must-fix item?
- [ ] Is a score of 3 reflected as a should-fix item?
- [ ] Do file inventory findings contradict any criterion score?

---

## Step 3: Skill checklist verification

**dm-limits-and-best-practices:**
- [ ] Checked for QueuedTaskRunner/semaphore usage on CDF calls
- [ ] Checked `instances.list` calls for cursor pagination
- [ ] Checked that `instances.search` is used for text matching (not `list`)
- [ ] Checked write operations are batched ≤1000
- [ ] Checked for unbounded `Promise.all` on raw API calls

**correctness-and-error-handling:**
- [ ] Checked for a top-level ErrorBoundary
- [ ] Checked that data-consuming components handle isLoading/isError/empty states
- [ ] Checked useEffect cleanup (timers, listeners, async)
- [ ] Checked for null/undefined safety on CDF data access

**security:**
- [ ] Checked for hardcoded secrets or credentials
- [ ] Checked `dangerouslySetInnerHTML` is sanitized where used
- [ ] Checked for `eval` / `new Function`
- [ ] Ran or referenced a dependency audit

**code-quality:**
- [ ] Flagged `any` types
- [ ] Flagged components >150 lines
- [ ] Checked for dead code and commented-out blocks

**design (Aura):**
- [ ] Assessed Aura usage vs custom UI
- [ ] Confirmed a score of 3 does not block approval (reviewer note applied)

---

## Step 4: Spot-check findings

Pick **3 must-fix items** and **2 should-fix items**. For each:
1. Read the cited file and line number
2. Verify the issue exists as described
3. Verify the criterion reference is correct
4. Verify the categorization (must/should/nice) follows the rules in `scoring-criteria.md`

Pick **2 files scored 5/5** in the file inventory. Read them and verify nothing was missed.

---

## Step 5: Append verdict to `review-report.md`

```
---
## Verification

**Format compliance:** [PASS / issues listed]
**Score accuracy:** [PASS / mismatches listed]
**Checklist coverage:** [PASS / gaps listed]
**Spot-checks:** [PASS / FAIL with explanation]

**Verdict:** [PASS | PASS WITH NOTES — minor gaps listed | FAIL — items to fix before declaring complete]
```

If the verdict is FAIL, fix the issues in the artifacts before declaring the review complete.
