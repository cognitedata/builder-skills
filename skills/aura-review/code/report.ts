// Adjust this relative path if this bundle was copied somewhere other than
// src/features/aura-review/ (see README.md) — it must resolve to the app's own
// aura-review/review.json, written by the aura-review skill's Step 5.
import auraReviewReviewJson from '../../../aura-review/review.json';
import type { AuraReviewReport } from './types';

// review.json is the skill's single structured source of truth (stats + every
// finding) — read it directly rather than hand-transcribing findings here.
export const auraReviewReport: AuraReviewReport = auraReviewReviewJson;
