import type { DMInstanceRef } from '@cognite/reveal';
import { use3dModels } from './useModels';
import { useFdmAssetMappings } from './useFdmMappings';
import type { CadModelOptions, ThreeDModelFdmMappings, CogniteModel } from '../types';
import type { Node3D } from '@cognite/sdk';
import { useMemo } from 'react';
import { Box3 } from 'three';

export type InstanceWithBoundingBox = {
  instance: DMInstanceRef;
  boundingBox: Box3;
};

export type InstancesWithBoxesAndOriginalInstance = {
  instancesWithBoxes: InstanceWithBoundingBox[];
  originalInstance: DMInstanceRef;
};

export type NodesWithModelInfo = {
  nodes: Node3D[];
  instance: DMInstanceRef;
  modelId: number;
  revisionId: number;
};

const combineNodeBoundingBoxes = (nodes: Node3D[]): Box3 =>
  nodes.reduce(
    (currentBox, nextNode) =>
      currentBox.union(
        nextNode.boundingBox !== undefined
          ? new Box3().setFromArray([
              ...nextNode.boundingBox.min,
              ...nextNode.boundingBox.max,
            ])
          : new Box3()
      ),
    new Box3()
  );

const getFdmDataWithBoundingBoxes = (
  modelsWithRelevantNodes: NodesWithModelInfo[],
  models: CogniteModel[]
): InstanceWithBoundingBox[] => {
  const cdfCoordinateBoundingBoxes = modelsWithRelevantNodes.map(
    (nodesWithModel) => combineNodeBoundingBoxes(nodesWithModel.nodes)
  );

  const selectedNodeCadModels = modelsWithRelevantNodes.map((nodeModelData) =>
    models.find(
      ({ modelId, revisionId }) =>
        modelId === nodeModelData.modelId &&
        revisionId === nodeModelData.revisionId
    )
  );

  if (
    selectedNodeCadModels.length === 0 ||
    cdfCoordinateBoundingBoxes.length === 0
  ) {
    return [];
  }

  const viewerCoordinateBoundingBoxes = selectedNodeCadModels
    .map((model, ind) =>
      model?.mapBoxFromCdfToModelCoordinates(cdfCoordinateBoundingBoxes[ind])
    )
    .filter((val) => val !== undefined);

  return viewerCoordinateBoundingBoxes.map((boundingBox, ind) => ({
    instance: modelsWithRelevantNodes[ind].instance!,
    boundingBox,
  }));
};

export function getNodesFromModelsFdmMappings(
  instances: DMInstanceRef[],
  mappings?: ThreeDModelFdmMappings[]
): NodesWithModelInfo[] {
  const nodesWithModelIds = mappings?.flatMap((modelMappings) =>
    instances.reduce((infoArray, instance) => {
      const nodes = modelMappings.mappings.get(`${instance.space}:${instance.externalId}`);
      if (nodes === undefined) {
        return infoArray;
      }
      infoArray.push({
        instance,
        modelId: modelMappings.modelId,
        revisionId: modelMappings.revisionId,
        nodes,
      });
      return infoArray;
    }, new Array<NodesWithModelInfo>())
  );
  return nodesWithModelIds ?? [];
}

const getBoundingBoxInstancesFromFdmAndModelMappings = (
  instances: DMInstanceRef[],
  modelMappings: ThreeDModelFdmMappings[] | undefined,
  models: CogniteModel[]
): InstanceWithBoundingBox[] => {
  const modelsWithRelevantNodes = getNodesFromModelsFdmMappings(
    instances,
    modelMappings
  );
  if (modelsWithRelevantNodes.length === 0) {
    return [];
  }
  return getFdmDataWithBoundingBoxes(modelsWithRelevantNodes, models);
};

export const useInstancesWithBoundingBoxes = (
  inputInstances: DMInstanceRef[]
) => {
  const models = use3dModels();
  const { data: modelNodeMappings } = useFdmAssetMappings(
    inputInstances,
    models as CadModelOptions[]
  );

  return useMemo(
    () =>
      getBoundingBoxInstancesFromFdmAndModelMappings(
        inputInstances,
        modelNodeMappings,
        models
      ),
    [modelNodeMappings, inputInstances, models]
  );
};
