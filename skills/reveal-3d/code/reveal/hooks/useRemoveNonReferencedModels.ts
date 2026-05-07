import { useEffect, useRef } from 'react';
import type { Cognite3DViewer } from '@cognite/reveal';

/**
 * Automatically removes models from the viewer that are no longer referenced
 * by the current component tree. Prevents memory accumulation when using
 * RevealKeepAlive for viewer persistence (50-70% memory reduction on navigation).
 */
export function useRemoveNonReferencedModels(
  viewer: Cognite3DViewer | null,
  activeModelKeys: Set<string>
) {
  const prevKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!viewer) return;

    const removed = [...prevKeysRef.current].filter((k) => !activeModelKeys.has(k));

    for (const key of removed) {
      const [modelIdStr, revisionIdStr] = key.split('-');
      const modelId = parseInt(modelIdStr, 10);
      const revisionId = parseInt(revisionIdStr, 10);

      if (isNaN(modelId) || isNaN(revisionId)) continue;

      const model = viewer.models.find(
        (m) => m.modelId === modelId && m.revisionId === revisionId
      );

      if (model) {
        try {
          viewer.removeModel(model);
        } catch (error) {
          console.error(
            `[useRemoveNonReferencedModels] Error removing model ${key}:`,
            error
          );
        }
      }
    }

    prevKeysRef.current = new Set(activeModelKeys);
  }, [viewer, activeModelKeys]);
}
