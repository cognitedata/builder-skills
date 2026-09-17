export type AuraReviewStats = {
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
};

export type AuraReviewNonComplianceFinding = {
  component: string;
  usages: number;
  couldHaveBeenAura: string | null;
  evidence: string;
};

export type AuraReviewUsageQualityFinding = {
  component: string;
  location: string;
  violates: string;
  quotedRule: string;
};

export type AuraReviewThirdPartyUsage = {
  identifier: string;
  usages: number;
  packageName: string;
};

export type AuraReviewReport = {
  appDir: string;
  stats: AuraReviewStats;
  nonComplianceFindings: AuraReviewNonComplianceFinding[];
  usageQualityFindings: AuraReviewUsageQualityFinding[];
  thirdPartyUsages: AuraReviewThirdPartyUsage[];
};
