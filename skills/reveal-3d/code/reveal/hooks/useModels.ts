import { useQuery } from '@tanstack/react-query';
import type { DMInstanceRef } from '@cognite/reveal';
import { useRevealContext } from './useRevealContext';
import type { TaggedAddResourceOptions } from '../types';
import { useReveal } from './useReveal';
import {
  COGNITE_VISUALIZABLE_VIEW,
  COGNITE_CAD_NODE_VIEW,
} from '../utils/views';
import { unwrapProperties } from '../utils/data-mapper';
import type { CDFNode } from '../utils/cdf-types';

interface CogniteCADNodeProperties {
  space: string;
  externalId: string;
  model3D: { externalId: string; space: string };
  revisions: Array<{ externalId: string; space: string }>;
}

/**
 * Extracts numeric ID from CDF external ID format (e.g., "cog_3d_model_12345" -> 12345)
 */
function extractNumericId(externalId: string): number | undefined {
  const lastUnderscoreIndex = externalId.lastIndexOf('_');
  if (lastUnderscoreIndex === -1) return undefined;

  const numericPart = externalId.substring(lastUnderscoreIndex + 1);
  const id = parseInt(numericPart, 10);
  return isNaN(id) ? undefined : id;
}

/**
 * Fetches 3D CAD models associated with an FDM instance via the Cognite Core Data Model.
 * Traverses: Asset -> object3D (CogniteVisualizable) -> CogniteCADNode -> models/revisions
 */
export function useModelsForInstanceQuery(instance: DMInstanceRef) {
  const { sdk } = useRevealContext();

  const result = useQuery({
    queryKey: ['3d-models-for-instance', instance.space, instance.externalId],
    queryFn: async () => {
      try {
        const response = await sdk.instances.query({
          with: {
            asset: {
              nodes: {
                filter: {
                  and: [
                    {
                      equals: {
                        property: ['node', 'externalId'],
                        value: instance.externalId,
                      },
                    },
                    {
                      equals: {
                        property: ['node', 'space'],
                        value: instance.space,
                      },
                    },
                  ],
                },
              },
            },
            object_3ds: {
              nodes: {
                from: 'asset',
                through: {
                  view: { type: 'view', ...COGNITE_VISUALIZABLE_VIEW },
                  identifier: 'object3D',
                },
                direction: 'outwards',
              },
            },
            cad_nodes: {
              nodes: {
                from: 'object_3ds',
                through: {
                  view: { type: 'view', ...COGNITE_CAD_NODE_VIEW },
                  identifier: 'object3D',
                },
                direction: 'inwards',
              },
            },
          },
          select: {
            cad_nodes: {
              sources: [
                {
                  source: { type: 'view', ...COGNITE_CAD_NODE_VIEW },
                  properties: ['model3D', 'revisions'],
                },
              ],
            },
          },
        });

        const models: TaggedAddResourceOptions[] = [];
        const seenModels = new Set<string>();

        // Extract model/revision info from CAD nodes
        const cadNodes = response.items?.cad_nodes || [];

        for (const node of cadNodes) {
          const props = unwrapProperties<CogniteCADNodeProperties>(
            node as CDFNode,
            COGNITE_CAD_NODE_VIEW
          );
          if (!props?.model3D || !Array.isArray(props.revisions)) {
            continue;
          }

          const modelId = extractNumericId(props.model3D.externalId);
          if (!modelId) continue;

          // Process each revision
          for (const revision of props.revisions) {
            const revisionId = extractNumericId(revision.externalId);
            if (!revisionId) continue;

            const modelKey = `${modelId}:${revisionId}`;
            if (seenModels.has(modelKey)) continue;

            seenModels.add(modelKey);
            models.push({ type: 'cad', addOptions: { modelId, revisionId } });
          }
        }

        return models;
      } catch (error) {
        console.error('[useModelsForInstanceQuery] Error:', error);
        return [] as TaggedAddResourceOptions[];
      }
    },
    enabled: !!sdk,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return result;
}

/**
 * Returns all loaded 3D models in the viewer.
 * Models are only present after Reveal3DResources has loaded them.
 *
 * Note: This returns the viewer.models array directly without polling.
 * Components should be structured so that model loading triggers re-renders naturally.
 */
export function use3dModels() {
  const viewer = useReveal();
  return viewer.models || [];
}
