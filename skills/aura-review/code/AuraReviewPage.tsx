import { Badge } from '@cognite/aura/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cognite/aura/components/card';
import { Separator } from '@cognite/aura/components/separator';
import { IconChartBar, IconX } from '@tabler/icons-react';

import { useAuraReviewViewModel } from './useAuraReviewViewModel';

export function AuraReviewPage({ onClose }: { onClose?: () => void } = {}) {
  const { report, auraCoverageLabel, couldHaveBeenAuraLabel } = useAuraReviewViewModel();

  return (
    <main className="min-h-screen bg-muted/50 text-foreground">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 py-8 sm:p-8">
        <Card className="relative">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Aura Review"
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <IconX aria-hidden className="size-4" />
            </button>
          )}
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3 pr-10">
              <IconChartBar aria-hidden className="size-6 text-primary" />
              <div className="space-y-1">
                <CardTitle as="h1">Aura Review</CardTitle>
                <CardDescription>
                  How well {report.appDir} uses Cognite&apos;s Aura design system, generated
                  automatically at deploy time.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Headline numbers">
              <HeadlineStat label="Aura coverage" value={auraCoverageLabel} />
              <HeadlineStat label="Could have been Aura" value={couldHaveBeenAuraLabel} />
              <HeadlineStat
                label="Usage-quality findings"
                value={String(report.stats.usageQualityFindingsCount)}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <h2 className="text-lg font-medium">Non-compliance findings</h2>
              <FindingsTable report={report} />
            </div>

            <Separator />

            <div className="space-y-2">
              <h2 className="text-lg font-medium">Excluded from judgment</h2>
              <p className="text-sm text-muted-foreground">
                Third-party components — not a design-system concern.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {report.thirdPartyUsages.map((usage) => (
                  <li key={usage.identifier}>
                    {usage.identifier} ({usage.usages} usages, from{' '}
                    <code className="text-xs">{usage.packageName}</code>)
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function HeadlineStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold">{value}</span>
      </CardContent>
    </Card>
  );
}

function FindingsTable({ report }: { report: ReturnType<typeof useAuraReviewViewModel>['report'] }) {
  if (report.nonComplianceFindings.length === 0) {
    return <p className="text-sm text-muted-foreground">No non-compliance findings.</p>;
  }

  // Plain HTML <table>, not Aura's DataGrid: DESIGN.md documents a "Table" pattern, but
  // it isn't actually shipped as an importable component in @cognite/aura (no ./table
  // export) — only DataGrid is, and it requires @tanstack/react-table column defs, which
  // is overkill for this static findings list. A semantic <table> is correct here, not a
  // compliance gap.
  return (
    <table className="w-full border-collapse text-sm" aria-label="Non-compliance findings">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="py-2 pr-4 font-medium">Component</th>
          <th className="py-2 pr-4 font-medium">Usages</th>
          <th className="py-2 pr-4 font-medium">Could have been</th>
          <th className="py-2 font-medium">Evidence</th>
        </tr>
      </thead>
      <tbody>
        {report.nonComplianceFindings.map((finding) => (
          <tr key={finding.component} className="border-b last:border-0">
            <td className="py-2 pr-4 align-top font-medium">{finding.component}</td>
            <td className="py-2 pr-4 align-top">{finding.usages}</td>
            <td className="py-2 pr-4 align-top">
              {finding.couldHaveBeenAura ? (
                <Badge variant="mountain" background>
                  {finding.couldHaveBeenAura}
                </Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </td>
            <td className="py-2 align-top text-muted-foreground">{finding.evidence}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
