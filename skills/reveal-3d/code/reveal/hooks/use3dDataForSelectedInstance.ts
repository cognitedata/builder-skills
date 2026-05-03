import type { DMInstanceRef } from '@cognite/reveal';
import { useMemo } from 'react';
import {
  useInstancesWithBoundingBoxes,
  type InstancesWithBoxesAndOriginalInstance,
} from './useInstancesWithBoundingBoxes';
import { useFindRelated3dInstances } from './useFindRelated3dInstances';

export const useInstancesWithBounds = (
  inputInstances: DMInstanceRef[],
  originalInstance: DMInstanceRef
): InstancesWithBoxesAndOriginalInstance | undefined => {
  const instancesWithBounds = useInstancesWithBoundingBoxes(inputInstances);

  return useMemo<InstancesWithBoxesAndOriginalInstance | undefined>(() => {
    if (inputInstances.length === 0 || instancesWithBounds.length === 0) {
      return undefined;
    }
    return { instancesWithBoxes: [...instancesWithBounds], originalInstance };
  }, [instancesWithBounds, inputInstances.length, originalInstance]);
};

export function use3dDataForSelectedInstance(
  instance: DMInstanceRef
): InstancesWithBoxesAndOriginalInstance | undefined {
  const threeDRelatedSelection = useFindRelated3dInstances(instance);
  const selectedInstancesWithBoundsAndCorrespondingInstance =
    useInstancesWithBounds(threeDRelatedSelection, instance);
  return selectedInstancesWithBoundsAndCorrespondingInstance;
}
