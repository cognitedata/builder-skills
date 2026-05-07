import type { Cognite3DViewer } from '@cognite/reveal';
import { QUALITY_PRESETS, type QualitySettings } from './QualityPresets';

const CAMERA_IDLE_DEBOUNCE_MS = 200;

/**
 * Centralized quality settings controller for the Reveal viewer.
 *
 * Manages CAD/point-cloud budgets, resolution caps, and dynamic resolution
 * scaling during camera movement. All API calls are wrapped in try/catch
 * so the controller never crashes viewer initialization if a method is
 * unavailable on a particular Reveal version.
 */
export class RevealSettingsController {
  private settings: QualitySettings;
  private viewer: Cognite3DViewer | null = null;
  private moveTimeout: ReturnType<typeof setTimeout> | null = null;
  private cameraChangeHandler: (() => void) | null = null;

  constructor(quality: 'low' | 'medium' | 'high' = 'medium') {
    this.settings = QUALITY_PRESETS[quality];
  }

  applyToViewer(viewer: Cognite3DViewer): void {
    this.removeEventListeners();
    this.viewer = viewer;

    try {
      if ('cadBudget' in viewer) {
        viewer.cadBudget = this.settings.cadBudget;
      }
    } catch (e) {
      console.warn('[RevealSettingsController] Failed to set cadBudget:', e);
    }

    try {
      if ('pointCloudBudget' in viewer) {
        viewer.pointCloudBudget = this.settings.pointCloudBudget;
      }
    } catch (e) {
      console.warn('[RevealSettingsController] Failed to set pointCloudBudget:', e);
    }

    try {
      if (typeof viewer.setResolutionOptions === 'function') {
        viewer.setResolutionOptions({
          maxRenderResolution: this.settings.resolutionOptions.maxRenderResolution,
        });
      }
    } catch (e) {
      console.warn('[RevealSettingsController] Failed to set resolution:', e);
    }

    this.setupDynamicResolution(viewer);
  }

  setQuality(quality: 'low' | 'medium' | 'high'): void {
    this.settings = QUALITY_PRESETS[quality];
    if (this.viewer) {
      this.applyToViewer(this.viewer);
    }
  }

  getSettings(): QualitySettings {
    return { ...this.settings };
  }

  dispose(): void {
    if (this.moveTimeout) {
      clearTimeout(this.moveTimeout);
      this.moveTimeout = null;
    }
    this.removeEventListeners();
  }

  private removeEventListeners(): void {
    if (this.viewer && this.cameraChangeHandler) {
      try {
        this.viewer.off('cameraChange', this.cameraChangeHandler);
      } catch {
        // Ignore if viewer is already disposed
      }
      this.cameraChangeHandler = null;
    }
  }

  private setupDynamicResolution(viewer: Cognite3DViewer): void {
    if (typeof viewer.setResolutionOptions !== 'function') {
      return;
    }

    this.cameraChangeHandler = () => {
      try {
        viewer.setResolutionOptions({
          maxRenderResolution:
            this.settings.resolutionOptions.maxRenderResolution *
            this.settings.resolutionOptions.movingCameraResolutionFactor,
        });

        if (this.moveTimeout) {
          clearTimeout(this.moveTimeout);
        }

        this.moveTimeout = setTimeout(() => {
          try {
            viewer.setResolutionOptions({
              maxRenderResolution: this.settings.resolutionOptions.maxRenderResolution,
            });
          } catch {
            // Viewer may have been disposed
          }
        }, CAMERA_IDLE_DEBOUNCE_MS);
      } catch {
        // Viewer may have been disposed
      }
    };

    try {
      viewer.on('cameraChange', this.cameraChangeHandler);
    } catch (e) {
      console.warn('[RevealSettingsController] Failed to add cameraChange listener:', e);
      this.cameraChangeHandler = null;
    }
  }
}
