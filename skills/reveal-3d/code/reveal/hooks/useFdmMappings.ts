import { useQuery } from '@tanstack/react-query';
import type { DMInstanceRef } from '@cognite/reveal';
import type { Node3D, CogniteClient } from '@cognite/sdk';
import { useRevealContext } from './useRevealContext';
import type { ThreeDModelFdmMappings, CadModelOptions } from '../types';
import {
  ASSET_VIEW,
  COGNITE_3D_OBJECT_VIEW,
  COGNITE_CAD_NODE_VIEW,
} from '../utils/views';
import { unwrapProperties } from '../utils/data-mapper';
import type { CDFNode } from '../utils/cdf-types';

interface DmsUniqueIdentifier {
  space: string;
  externalId: string;
}

interface CogniteAssetProperties {
  space: string;
  externalId: string;
  object3D: DmsUniqueIdentifier;
}

interface CogniteCADNodeProperties {
  space: string;
  externalId: string;
  object3D: DmsUniqueIdentifier;
  model3D: DmsUniqueIdentifier;
  revisions: DmsUniqueIdentifier[];
  treeIndexes: number[];
  subTreeSizes: number[];
}

/**
 * Fetches FDM-to-CAD mappings using Core DM connections.
 * This queries the data model for CAD nodes connected to assets via object3D references.
 */
export function useFdmAssetMappings(
  instances: DMInstanceRef[],
  models: CadModelOptions[]
) {
  const { sdk } = useRevealContext();
  return useQuery({
    queryKey: [
      'fdm-cad-connections',
      instances.map((i) => `${i.space}:${i.externalId}`).join(','),
      models.map((m) => `${m.modelId}:${m.revisionId}`).join(','),
    ],
    queryFn: async (): Promise<ThreeDModelFdmMappings[]> => {
      if (instances.length === 0 || models.length === 0) {
        return [];
      }

      try {
        // Step 1: Query DMS for CAD connections
        // This traverses: Assets → object3D → CAD nodes
        const queryResult = await sdk.instances.query({
          with: {
            // Start from the input instances (assets)
            assets: {
              nodes: {
                filter: {
                  and: [
                    {
                      in: {
                        property: ['node', 'space'],
                        values: [
                          ...new Set(instances.map((inst) => inst.space)),
                        ],
                      },
                    },
                    {
                      in: {
                        property: ['node', 'externalId'],
                        values: instances.map((inst) => inst.externalId),
                      },
                    },
                  ],
                },
              },
            },
            // Navigate to object3D (Cognite3DObject)
            object_3ds: {
              nodes: {
                from: 'assets',
                through: {
                  view: { type: 'view', ...ASSET_VIEW },
                  identifier: 'object3D',
                },
                direction: 'outwards',
                filter: {
                  hasData: [{ type: 'view', ...COGNITE_3D_OBJECT_VIEW }],
                },
              },
            },
            // Navigate back to CAD nodes that reference this object3D
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
            assets: {
              sources: [
                {
                  source: { type: 'view', ...ASSET_VIEW },
                  properties: ['object3D'],
                },
              ],
            },
            cad_nodes: {
              sources: [
                {
                  source: { type: 'view', ...COGNITE_CAD_NODE_VIEW },
                  properties: [
                    'object3D',
                    'model3D',
                    'revisions',
                    'treeIndexes',
                    'subTreeSizes',
                  ],
                },
              ],
            },
          },
        });

        // Step 2: Build mappings per model/revision
        const mappingsByModel = new Map<string, Map<string, Node3D[]>>();

        const cadNodes = queryResult.items.cad_nodes || [];

        // Group CAD nodes by which instances reference them
        const object3DToAssets = new Map<string, DMInstanceRef[]>();
        for (const asset of queryResult.items.assets || []) {
          const props = unwrapProperties<CogniteAssetProperties>(
            asset as CDFNode,
            ASSET_VIEW
          );
          if (props?.object3D) {
            const key = `${props.object3D.space}/${props.object3D.externalId}`;
            const existing = object3DToAssets.get(key) || [];
            existing.push({ space: asset.space, externalId: asset.externalId });
            object3DToAssets.set(key, existing);
          }
        }

        // Collect all (modelId, revisionId, treeIndex) tuples for batch fetching
        interface NodeRequest {
          modelId: number;
          revisionId: number;
          treeIndex: number;
          assetInstances: DMInstanceRef[];
        }

        const nodeRequests: NodeRequest[] = [];

        // Process CAD nodes to build Node3D mappings
        for (const cadNode of cadNodes) {
          const props = unwrapProperties<CogniteCADNodeProperties>(
            cadNode as CDFNode,
            COGNITE_CAD_NODE_VIEW
          );
          if (!props) continue;

          const { model3D, revisions, treeIndexes, object3D } = props;
          if (!model3D || !revisions || !treeIndexes) continue;

          // Find which assets reference this CAD node
          const object3DKey = `${object3D.space}/${object3D.externalId}`;
          const relatedAssets = object3DToAssets.get(object3DKey);
          if (!relatedAssets) continue;

          // Extract modelId and match with requested models
          const modelId = extractModelId(model3D.externalId);

          // For each revision/treeIndex pair
          for (let i = 0; i < revisions.length; i++) {
            const revision = revisions[i];
            const treeIndex = treeIndexes[i];
            const revisionId = extractRevisionId(revision.externalId);

            // Check if this model/revision is in our requested list
            const matchingModel = models.find(
              (m) => m.modelId === modelId && m.revisionId === revisionId
            );
            if (!matchingModel) continue;

            nodeRequests.push({
              modelId,
              revisionId,
              treeIndex,
              assetInstances: relatedAssets,
            });
          }
        }

        // Batch fetch nodes by revision
        const nodesByRevision = new Map<string, NodeRequest[]>();
        for (const req of nodeRequests) {
          const key = `${req.modelId}/${req.revisionId}`;
          const existing = nodesByRevision.get(key) || [];
          existing.push(req);
          nodesByRevision.set(key, existing);
        }

        // Fetch all nodes in parallel per revision
        const revisionFetchPromises = Array.from(nodesByRevision.entries()).map(
          async ([revisionKey, requests]) => {
            const [modelId, revisionId] = revisionKey.split('/').map(Number);
            const treeIndexes = requests.map((r) => r.treeIndex);

            const nodes = await fetchNodesByTreeIndex(
              sdk,
              modelId,
              revisionId,
              treeIndexes
            );

            return { revisionKey, nodes, requests };
          }
        );

        const allRevisionData = await Promise.all(revisionFetchPromises);

        for (const { revisionKey, nodes, requests } of allRevisionData) {
          const treeIndexToNode = new Map(
            nodes.map((node) => [node.treeIndex, node])
          );

          const modelMappings =
            mappingsByModel.get(revisionKey) ?? new Map<string, Node3D[]>();
          mappingsByModel.set(revisionKey, modelMappings);

          for (const req of requests) {
            const node3D = treeIndexToNode.get(req.treeIndex);
            if (!node3D) continue;

            for (const instance of req.assetInstances) {
              const instanceKey = `${instance.space}:${instance.externalId}`;
              const arr = modelMappings.get(instanceKey) ?? [];
              arr.push(node3D);
              modelMappings.set(instanceKey, arr);
            }
          }
        }

        // Convert to result format
        const results: ThreeDModelFdmMappings[] = [];
        for (const model of models) {
          const modelKey = `${model.modelId}/${model.revisionId}`;
          results.push({
            modelId: model.modelId,
            revisionId: model.revisionId,
            mappings: mappingsByModel.get(modelKey) ?? new Map(),
          });
        }

        return results;
      } catch (error) {
        console.error('Error fetching FDM CAD connections:', error);
        return [];
      }
    },
    enabled: !!sdk && instances.length > 0 && models.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Helper to extract numeric modelId from externalId like "model_123_space"
function extractModelId(externalId: string): number {
  const match = externalId.match(/model_(\d+)/);
  return match ? parseInt(match[1], 10) : -1;
}

// Helper to extract numeric revisionId from externalId like "model_123_revision_456_space"
function extractRevisionId(externalId: string): number {
  const match = externalId.match(/revision_(\d+)/);
  return match ? parseInt(match[1], 10) : -1;
}

/**
 * Fetch 3D nodes by their tree indices using the optimized internal IDs endpoint.
 * This is much more efficient than fetching all nodes and filtering.
 */
async function fetchNodesByTreeIndex(
  sdk: CogniteClient,
  modelId: number,
  revisionId: number,
  treeIndexes: number[]
): Promise<Node3D[]> {
  if (treeIndexes.length === 0) {
    return [];
  }

  // Deduplicate tree indices
  const uniqueTreeIndexes = Array.from(new Set(treeIndexes));

  // Step 1: Convert tree indices to internal node IDs
  const nodeIdResponse = await sdk.post<{ items: number[] }>(
    `/api/v1/projects/${sdk.project}/3d/models/${modelId}/revisions/${revisionId}/nodes/internalids/bytreeindices`,
    {
      data: {
        items: uniqueTreeIndexes,
      },
    }
  );

  const nodeIds = nodeIdResponse.data.items;

  if (nodeIds.length === 0) {
    return [];
  }

  // Step 2: Retrieve full node details by internal IDs
  const nodes = await sdk.revisions3D.retrieve3DNodes(
    modelId,
    revisionId,
    nodeIds.map((id) => ({ id }))
  );

  return nodes;
}
