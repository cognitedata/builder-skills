import { useEffect, useRef } from 'react';
import {
  type CogniteCadModel,
  TreeIndexNodeCollection,
  NumericRange,
} from '@cognite/reveal';
import { useReveal } from '../hooks/useReveal';
import type { AddCadResourceOptions, InstanceStylingGroup } from '../types';
import { useFdmAssetMappings } from '../hooks/useFdmMappings';

interface Reveal3DResourcesProps {
  resources: AddCadResourceOptions[];
  instanceStyling?: InstanceStylingGroup[];
  onModelsLoaded?: () => void;
}

export function Reveal3DResources({
  resources,
  instanceStyling = [],
  onModelsLoaded,
}: Reveal3DResourcesProps) {
  const viewer = useReveal();
  const loadedModelsRef = useRef<CogniteCadModel[]>([]);

  useEffect(() => {
    if (!viewer || resources.length === 0) {
      return;
    }

    const cancelledRef = { current: false };

    const loadModels = async () => {
      const modelPromises = resources.map(async (resource) => {
        if (cancelledRef.current) return null;

        try {
          const existing = viewer.models.find(
            (m) =>
              m.modelId === resource.modelId &&
              m.revisionId === resource.revisionId
          );

          if (existing) {
            return existing as CogniteCadModel;
          }

          const addModelOptions: {
            modelId: number;
            revisionId: number;
            geometryFilter?: typeof resource.geometryFilter;
          } = {
            modelId: resource.modelId,
            revisionId: resource.revisionId,
          };
          if (resource.geometryFilter) {
            addModelOptions.geometryFilter = resource.geometryFilter;
          }
          const model = await viewer.addCadModel(addModelOptions);

          if (cancelledRef.current) {
            viewer.removeModel(model);
            return null;
          }

          if (resource.styling?.default) {
            const { renderGhosted, renderInFront } = resource.styling.default;
            if (renderGhosted !== undefined) {
              model.setDefaultNodeAppearance({
                renderGhosted,
                renderInFront: renderInFront ?? false,
              });
            }
          }

          return model;
        } catch (error) {
          console.error('Error loading CAD model:', error);
          return null;
        }
      });

      const loadedModels = (await Promise.all(modelPromises)).filter(
        (model): model is CogniteCadModel => model !== null
      );

      if (!cancelledRef.current) {
        loadedModelsRef.current = loadedModels;

        if (loadedModels.length > 0) {
          viewer.fitCameraToModels(loadedModels, 0);
        }

        if (onModelsLoaded) {
          onModelsLoaded();
        }
      }
    };

    loadModels();

    return () => {
      cancelledRef.current = true;
      const modelsToRemove = loadedModelsRef.current;
      for (const model of modelsToRemove) {
        try {
          viewer.removeModel(model);
        } catch (error) {
          console.error('Error removing model:', error);
        }
      }
      loadedModelsRef.current = [];
    };
  }, [viewer, resources, onModelsLoaded]);

  useApplyInstanceStyling(viewer, loadedModelsRef.current, instanceStyling);

  return null;
}

function useApplyInstanceStyling(
  viewer: ReturnType<typeof useReveal>,
  loadedModels: CogniteCadModel[],
  instanceStyling: InstanceStylingGroup[]
) {
  const appliedCollectionsRef = useRef<
    Map<CogniteCadModel, TreeIndexNodeCollection[]>
  >(new Map());

  const fdmInstances =
    instanceStyling.flatMap((group) => group.fdmAssetExternalIds || []) || [];

  const modelOptions = loadedModels.map((model) => ({
    type: 'cad' as const,
    modelId: model.modelId,
    revisionId: model.revisionId,
  }));

  const { data: assetMappings } = useFdmAssetMappings(
    fdmInstances,
    modelOptions
  );

  useEffect(() => {
    if (!viewer || loadedModels.length === 0) return;

    const hasFdmInstances = instanceStyling.some(
      (g) => g.fdmAssetExternalIds && g.fdmAssetExternalIds.length > 0
    );

    if (!hasFdmInstances) {
      for (const [model, collections] of appliedCollectionsRef.current.entries()) {
        for (const collection of collections) {
          try { model.unassignStyledNodeCollection(collection); } catch { /* already removed */ }
        }
      }
      appliedCollectionsRef.current.clear();
      return;
    }

    if (!assetMappings) return;

    for (const [model, collections] of appliedCollectionsRef.current.entries()) {
      for (const collection of collections) {
        try { model.unassignStyledNodeCollection(collection); } catch { /* already removed */ }
      }
    }
    appliedCollectionsRef.current.clear();

    for (const stylingGroup of instanceStyling) {
      if (!stylingGroup.fdmAssetExternalIds || !stylingGroup.style.cad) {
        continue;
      }

      const appearance = stylingGroup.style.cad;

      for (const model of loadedModels) {
        const modelMapping = assetMappings.find(
          (m) =>
            m.modelId === model.modelId && m.revisionId === model.revisionId
        );

        if (!modelMapping) continue;

        const nodeCollection = new TreeIndexNodeCollection();
        const indexSet = nodeCollection.getIndexSet();

        for (const instance of stylingGroup.fdmAssetExternalIds) {
          const nodes = modelMapping.mappings.get(`${instance.space}:${instance.externalId}`);
          if (!nodes) continue;

          for (const node of nodes) {
            if (
              node.treeIndex !== undefined &&
              node.subtreeSize !== undefined
            ) {
              const range = new NumericRange(node.treeIndex, node.subtreeSize);
              indexSet.addRange(range);
            }
          }
        }

        if (indexSet.count > 0) {
          nodeCollection.updateSet(indexSet);
          model.assignStyledNodeCollection(nodeCollection, appearance);

          const existing = appliedCollectionsRef.current.get(model) ?? [];
          existing.push(nodeCollection);
          appliedCollectionsRef.current.set(model, existing);
        }
      }
    }
  }, [viewer, loadedModels, instanceStyling, assetMappings]);
}
