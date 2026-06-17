import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DMInstanceRef } from '@cognite/reveal';
import type { Node3D, CogniteClient } from '@cognite/sdk';
import { useRevealContext } from './useRevealContext';
import type { ThreeDModelFdmMappings } from '../types';
import {
  ASSET_VIEW,
  COGNITE_3D_OBJECT_VIEW,
  COGNITE_CAD_NODE_VIEW,
} from '../utils/views';
import { unwrapProperties } from '../utils/data-mapper';
import type { CDFNode } from '../utils/cdf-types';
import { executeParallel, chunk } from '../utils/executeParallel';

const TREE_INDEX_CHUNK_SIZE = 1000;
const NODE_ID_CHUNK_SIZE = 100;

interface ModelRef {
  modelId: number;
  revisionId: number;
}

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
 * Prefetch FDM asset mappings using model IDs from the query result,
 * NOT waiting for models to be loaded into the viewer.
 *
 * This eliminates 1-3 seconds from the critical path by running mapping fetch
 * in parallel with model loading instead of sequentially after.
 */
export function usePrefetchedFdmMappings(
  instances: DMInstanceRef[],
  modelRefs: ModelRef[]
) {
  const { sdk } = useRevealContext();

  const instancesKey = useMemo(
    () => instances.map((i) => `${i.space}:${i.externalId}`).join(','),
    [instances]
  );
  const modelRefsKey = useMemo(
    () => modelRefs.map((m) => `${m.modelId}:${m.revisionId}`).join(','),
    [modelRefs]
  );

  return useQuery({
    queryKey: ['fdm-cad-connections-prefetched', instancesKey, modelRefsKey],
    queryFn: async (): Promise<ThreeDModelFdmMappings[]> => {
      if (instances.length === 0 || modelRefs.length === 0) {
        return [];
      }

      try {
        const queryResult = await sdk.instances.query({
          with: {
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

        const mappingsByModel = new Map<string, Map<string, Node3D[]>>();
        const cadNodes = queryResult.items.cad_nodes || [];

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

        interface NodeRequest {
          modelId: number;
          revisionId: number;
          treeIndex: number;
          assetInstances: DMInstanceRef[];
        }

        const nodeRequests: NodeRequest[] = [];

        for (const cadNode of cadNodes) {
          const props = unwrapProperties<CogniteCADNodeProperties>(
            cadNode as CDFNode,
            COGNITE_CAD_NODE_VIEW
          );
          if (!props) continue;

          const { model3D, revisions, treeIndexes, object3D } = props;
          if (!model3D || !revisions || !treeIndexes) continue;

          const object3DKey = `${object3D.space}/${object3D.externalId}`;
          const relatedAssets = object3DToAssets.get(object3DKey);
          if (!relatedAssets) continue;

          const modelId = extractModelId(model3D.externalId);

          for (let i = 0; i < revisions.length; i++) {
            const revision = revisions[i];
            const treeIndex = treeIndexes[i];
            const revisionId = extractRevisionId(revision.externalId);

            const matchingModel = modelRefs.find(
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

        const nodesByRevision = new Map<string, NodeRequest[]>();
        for (const req of nodeRequests) {
          const key = `${req.modelId}/${req.revisionId}`;
          const existing = nodesByRevision.get(key) || [];
          existing.push(req);
          nodesByRevision.set(key, existing);
        }

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

        const results: ThreeDModelFdmMappings[] = [];
        for (const modelRef of modelRefs) {
          const modelKey = `${modelRef.modelId}/${modelRef.revisionId}`;
          results.push({
            modelId: modelRef.modelId,
            revisionId: modelRef.revisionId,
            mappings: mappingsByModel.get(modelKey) ?? new Map(),
          });
        }

        return results;
      } catch (error) {
        console.error('Error prefetching FDM CAD connections:', error);
        return [];
      }
    },
    enabled: !!sdk && instances.length > 0 && modelRefs.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

function extractModelId(externalId: string): number {
  const match = externalId.match(/model_(\d+)/);
  return match ? parseInt(match[1], 10) : -1;
}

function extractRevisionId(externalId: string): number {
  const match = externalId.match(/revision_(\d+)/);
  return match ? parseInt(match[1], 10) : -1;
}

async function fetchNodesByTreeIndex(
  sdk: CogniteClient,
  modelId: number,
  revisionId: number,
  treeIndexes: number[]
): Promise<Node3D[]> {
  if (treeIndexes.length === 0) return [];

  const uniqueTreeIndexes = Array.from(new Set(treeIndexes));
  const treeIndexChunks = chunk(uniqueTreeIndexes, TREE_INDEX_CHUNK_SIZE);

  const results = await executeParallel(
    treeIndexChunks.map((indexChunk) => async () => {
      const nodeIdResponse = await sdk.post<{ items: number[] }>(
        `/api/v1/projects/${sdk.project}/3d/models/${modelId}/revisions/${revisionId}/nodes/internalids/bytreeindices`,
        {
          data: { items: indexChunk },
        }
      );

      const nodeIds = nodeIdResponse.data.items;
      if (nodeIds.length === 0) return [];

      const nodeIdChunks = chunk(nodeIds, NODE_ID_CHUNK_SIZE);
      const nodeResults = await executeParallel(
        nodeIdChunks.map((idChunk) => async () => {
          const nodes = await sdk.revisions3D.retrieve3DNodes(
            modelId,
            revisionId,
            idChunk.map((id) => ({ id }))
          );
          return Array.isArray(nodes) ? nodes : [];
        }),
        3
      );

      return nodeResults.flat().filter((node): node is Node3D => node !== undefined);
    }),
    3
  );

  return results.flat().filter((node): node is Node3D => node !== undefined);
}
