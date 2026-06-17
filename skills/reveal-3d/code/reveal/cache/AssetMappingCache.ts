import type { Node3D } from '@cognite/sdk';
import type { DMInstanceRef } from '@cognite/reveal';
import { chunk, executeParallel } from '../utils/executeParallel';

const ASSET_MAPPING_CHUNK_SIZE = 1000;

/**
 * Multi-level asset mapping cache with split-chunk strategy.
 *
 * Three-way indexing:
 * - By model+revision: Fast lookup for all mappings in a model
 * - By asset instance (space:externalId): Fast lookup for all nodes belonging to an asset
 * - By node ID: Fast lookup for individual node metadata
 */
export class AssetMappingCache {
  private byModelCache = new Map<string, Map<string, Node3D[]>>();
  private byAssetCache = new Map<string, Node3D[]>();
  private byNodeCache = new Map<string, Node3D>();

  async getOrFetch(
    modelId: number,
    revisionId: number,
    assetInstances: DMInstanceRef[],
    fetchFn: (
      modelId: number,
      revisionId: number,
      instances: DMInstanceRef[]
    ) => Promise<Map<string, Node3D[]>>
  ): Promise<Map<string, Node3D[]>> {
    const modelKey = this.createModelKey(modelId, revisionId);

    const cachedModel = this.byModelCache.get(modelKey);
    if (cachedModel) {
      const { cached, uncached } = this.splitCachedAndMissing(
        assetInstances,
        cachedModel
      );

      if (uncached.length === 0) {
        return cached;
      }

      const fetched = await this.fetchAndCache(
        modelId,
        revisionId,
        uncached,
        fetchFn
      );

      return this.mergeMappings(cached, fetched);
    }

    return this.fetchAndCache(modelId, revisionId, assetInstances, fetchFn);
  }

  getCachedAssetMapping(instance: DMInstanceRef): Node3D[] | undefined {
    return this.byAssetCache.get(this.createAssetKey(instance));
  }

  getCachedNode(modelId: number, revisionId: number, treeIndex: number): Node3D | undefined {
    const key = this.createNodeKey(modelId, revisionId, treeIndex);
    return this.byNodeCache.get(key);
  }

  clear(): void {
    this.byModelCache.clear();
    this.byAssetCache.clear();
    this.byNodeCache.clear();
  }

  clearModel(modelId: number, revisionId: number): void {
    const modelKey = this.createModelKey(modelId, revisionId);
    this.byModelCache.delete(modelKey);
  }

  private createAssetKey(instance: DMInstanceRef): string {
    return `${instance.space}:${instance.externalId}`;
  }

  private createModelKey(modelId: number, revisionId: number): string {
    return `${modelId}/${revisionId}`;
  }

  private createNodeKey(modelId: number, revisionId: number, treeIndex: number): string {
    return `${modelId}/${revisionId}/${treeIndex}`;
  }

  private splitCachedAndMissing(
    assetInstances: DMInstanceRef[],
    cachedModel: Map<string, Node3D[]>
  ): {
    cached: Map<string, Node3D[]>;
    uncached: DMInstanceRef[];
  } {
    const cached = new Map<string, Node3D[]>();
    const uncached: DMInstanceRef[] = [];

    for (const instance of assetInstances) {
      const assetKey = this.createAssetKey(instance);
      const cachedNodes = cachedModel.get(assetKey);
      if (cachedNodes) {
        cached.set(assetKey, cachedNodes);
      } else {
        uncached.push(instance);
      }
    }

    return { cached, uncached };
  }

  private async fetchAndCache(
    modelId: number,
    revisionId: number,
    assetInstances: DMInstanceRef[],
    fetchFn: (
      modelId: number,
      revisionId: number,
      instances: DMInstanceRef[]
    ) => Promise<Map<string, Node3D[]>>
  ): Promise<Map<string, Node3D[]>> {
    const chunks = chunk(assetInstances, ASSET_MAPPING_CHUNK_SIZE);

    const results = await executeParallel(
      chunks.map((chunkInstances) => async () => {
        return fetchFn(modelId, revisionId, chunkInstances);
      }),
      3
    );

    const merged = new Map<string, Node3D[]>();
    for (const result of results) {
      if (result) {
        for (const [assetKey, nodes] of result.entries()) {
          merged.set(assetKey, nodes);
        }
      }
    }

    this.indexMappings(modelId, revisionId, merged);

    return merged;
  }

  private indexMappings(
    modelId: number,
    revisionId: number,
    mappings: Map<string, Node3D[]>
  ): void {
    const modelKey = this.createModelKey(modelId, revisionId);

    let modelCache = this.byModelCache.get(modelKey);
    if (!modelCache) {
      modelCache = new Map();
      this.byModelCache.set(modelKey, modelCache);
    }

    for (const [assetKey, nodes] of mappings.entries()) {
      modelCache.set(assetKey, nodes);
      this.byAssetCache.set(assetKey, nodes);

      for (const node of nodes) {
        if (node.treeIndex !== undefined) {
          const nodeKey = this.createNodeKey(modelId, revisionId, node.treeIndex);
          this.byNodeCache.set(nodeKey, node);
        }
      }
    }
  }

  private mergeMappings(
    map1: Map<string, Node3D[]>,
    map2: Map<string, Node3D[]>
  ): Map<string, Node3D[]> {
    const merged = new Map(map1);
    for (const [key, value] of map2.entries()) {
      merged.set(key, value);
    }
    return merged;
  }
}
