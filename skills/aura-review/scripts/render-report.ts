import * as fs from 'node:fs';
import * as path from 'node:path';

interface AuraReviewStats {
  auraCoveragePct: number;
  auraUsages: number;
  nonAuraUsages: number;
  allAuraUsages: number;
  allNonAuraUsages: number;
  couldHaveBeenAuraPct: number;
  couldHaveBeenAuraCount: number;
  couldHaveBeenAuraConsideredCount: number;
  couldHaveBeenAuraOfNonAuraPct: number;
  usageQualityFindingsCount: number;
}

interface NonComplianceFinding {
  component: string;
  usages: number;
  couldHaveBeenAura: string | null;
  evidence: string;
}

interface UsageQualityFinding {
  component: string;
  location: string;
  violates: string;
  quotedRule: string;
}

interface ThirdPartyUsage {
  identifier: string;
  usages: number;
  packageName: string;
}

interface AuraReview {
  appDir: string;
  stats: AuraReviewStats;
  nonComplianceFindings: NonComplianceFinding[];
  usageQualityFindings: UsageQualityFinding[];
  thirdPartyUsages: ThirdPartyUsage[];
}

function pct(fraction: number): string {
  return `${Math.round(fraction * 1000) / 10}%`;
}

function nonComplianceTable(findings: NonComplianceFinding[]): string {
  if (findings.length === 0) {
    return 'No non-compliance findings.';
  }
  const rows = findings.map(
    (f) =>
      `| ${f.component} | ${f.usages} | ${f.couldHaveBeenAura ?? '—'} | ${f.evidence} |`
  );
  return [
    '| Component | Usages | Could have been | Evidence |',
    '| --------- | ------ | --------------- | -------- |',
    ...rows,
  ].join('\n');
}

function usageQualityTable(findings: UsageQualityFinding[]): string {
  if (findings.length === 0) {
    return 'No documented Aura rule violations were found.';
  }
  const rows = findings.map(
    (f) => `| ${f.component} | ${f.location} | ${f.violates} | ${f.quotedRule} |`
  );
  return [
    '| Aura component | File:Line | Violates | Quoted rule |',
    '| -------------- | --------- | -------- | ----------- |',
    ...rows,
  ].join('\n');
}

function thirdPartyList(usages: ThirdPartyUsage[]): string {
  if (usages.length === 0) {
    return 'None.';
  }
  return usages
    .map((u) => `- ${u.identifier} (${u.usages} usages, from \`${u.packageName}\`)`)
    .join('\n');
}

export function renderReport(review: AuraReview): string {
  const { stats } = review;
  return `# Aura Review — ${review.appDir}

## Headline numbers

- Aura coverage: ${pct(stats.auraCoveragePct)} (${stats.auraUsages} / ${
    stats.auraUsages + stats.nonAuraUsages
  } distinct component types; ${stats.allAuraUsages} / ${
    stats.allAuraUsages + stats.allNonAuraUsages
  } raw occurrences)
- Could have been Aura: ${pct(stats.couldHaveBeenAuraPct)} (${stats.couldHaveBeenAuraCount} / ${
    stats.couldHaveBeenAuraConsideredCount
  } custom components had a documented Aura equivalent; ${pct(
    stats.couldHaveBeenAuraOfNonAuraPct
  )} of all non-Aura usages)
- Documented usage-quality findings: ${stats.usageQualityFindingsCount}

## Non-compliance findings

${nonComplianceTable(review.nonComplianceFindings)}

## Usage-quality findings

${usageQualityTable(review.usageQualityFindings)}

## Excluded from judgment (third-party, not a design-system concern)

${thirdPartyList(review.thirdPartyUsages)}
`;
}

function main(): void {
  const args = process.argv.slice(2);
  const reviewPath = args[0];
  if (!reviewPath) {
    console.error('Usage: render-report.ts <review.json path> [--out <file>]');
    process.exit(1);
  }
  const outIndex = args.indexOf('--out');
  const outFile = outIndex !== -1 ? args[outIndex + 1] : null;

  const review = JSON.parse(fs.readFileSync(reviewPath, 'utf-8')) as AuraReview;
  const markdown = renderReport(review);

  if (outFile) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, markdown);
    console.log(`Wrote report to ${outFile}`);
  } else {
    console.log(markdown);
  }
}

if (require.main === module) {
  main();
}
