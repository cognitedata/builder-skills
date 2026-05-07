import { useMemo } from 'react';
import { useEffect, useState } from 'react';
import { useRenderTarget } from './useRenderTarget';
import type { FdmAssetStylingGroup, InstanceStylingGroup } from '../types';
import { DefaultNodeAppearance, type DMInstanceRef } from '@cognite/reveal';
import { use3dDataForSelectedInstance } from './use3dDataForSelectedInstance';
import type { InstanceWithBoundingBox } from './useInstancesWithBoundingBoxes';

const useCentralizedInstanceStyling = (): InstanceStylingGroup[] => {
  const [instanceStylingGroups, setInstanceStylingGroups] = useState<
    InstanceStylingGroup[]
  >([]);
  const instanceStylingController = useRenderTarget().instanceStylingController;

  useEffect(() => {
    const onStylingChange = () => {
      setInstanceStylingGroups([
        ...instanceStylingController.getStylingGroups(),
      ]);
    };

    instanceStylingController.addEventListener(onStylingChange);
    return () => {
      instanceStylingController.removeEventListener(onStylingChange);
    };
  }, [instanceStylingController]);

  return instanceStylingGroups;
};

const getInstanceStyling = (
  instances: InstanceWithBoundingBox[]
): FdmAssetStylingGroup[] =>
  instances.length === 0
    ? []
    : [
        {
          fdmAssetExternalIds: instances.map(({ instance }) => instance),
          style: {
            cad: DefaultNodeAppearance.Highlighted,
            pointcloud: DefaultNodeAppearance.Highlighted,
          },
        },
      ];

export const useInstanceStyling = (instance: DMInstanceRef) => {
  const selectedInstancesAndOriginalInstance =
    use3dDataForSelectedInstance(instance);

  const centralizedInstanceStyling = useCentralizedInstanceStyling();

  return useMemo(
    () => [
      ...centralizedInstanceStyling,
      ...getInstanceStyling(
        selectedInstancesAndOriginalInstance?.instancesWithBoxes ?? []
      ),
    ],
    [
      selectedInstancesAndOriginalInstance?.instancesWithBoxes,
      centralizedInstanceStyling,
    ]
  );
};
