import { auraReviewReport } from './report';
import type { AuraReviewReport } from './types';

export type AuraReviewViewModel = {
  report: AuraReviewReport;
  auraCoverageLabel: string;
  couldHaveBeenAuraLabel: string;
};

function toPercentLabel(fraction: number): string {
  return `${Math.round(fraction * 1000) / 10}%`;
}

const defaultDeps = { getReport: () => auraReviewReport };

export type UseAuraReviewViewModelDeps = typeof defaultDeps;

export function useAuraReviewViewModel(
  overrides?: Partial<UseAuraReviewViewModelDeps>
): AuraReviewViewModel {
  const { getReport } = { ...defaultDeps, ...overrides };
  const report = getReport();

  return {
    report,
    auraCoverageLabel: toPercentLabel(report.stats.auraCoveragePct),
    couldHaveBeenAuraLabel: toPercentLabel(report.stats.couldHaveBeenAuraPct),
  };
}
