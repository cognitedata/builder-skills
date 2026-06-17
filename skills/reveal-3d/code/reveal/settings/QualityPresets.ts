export interface QualitySettings {
  cadBudget: {
    maximumRenderCost: number;
    highDetailProximityThreshold: number;
  };
  pointCloudBudget: {
    numberOfPoints: number;
  };
  resolutionOptions: {
    maxRenderResolution: number;
    movingCameraResolutionFactor: number;
  };
}

export const QUALITY_PRESETS: Record<'low' | 'medium' | 'high', QualitySettings> = {
  low: {
    cadBudget: {
      maximumRenderCost: 5_000_000,
      highDetailProximityThreshold: 0,
    },
    pointCloudBudget: {
      numberOfPoints: 1_000_000,
    },
    resolutionOptions: {
      maxRenderResolution: 0.7e6,
      movingCameraResolutionFactor: 0.3,
    },
  },
  medium: {
    cadBudget: {
      maximumRenderCost: 15_000_000,
      highDetailProximityThreshold: 0,
    },
    pointCloudBudget: {
      numberOfPoints: 3_000_000,
    },
    resolutionOptions: {
      maxRenderResolution: 1.4e6,
      movingCameraResolutionFactor: 0.5,
    },
  },
  high: {
    cadBudget: {
      maximumRenderCost: 45_000_000,
      highDetailProximityThreshold: 10,
    },
    pointCloudBudget: {
      numberOfPoints: 12_000_000,
    },
    resolutionOptions: {
      maxRenderResolution: Infinity,
      movingCameraResolutionFactor: 1.0,
    },
  },
};
