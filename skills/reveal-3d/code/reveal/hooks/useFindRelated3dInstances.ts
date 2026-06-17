import { useMemo } from 'react';
import {
  use3dRelatedDirectConnections,
  use3dRelatedEdgeConnections,
} from './useRelatedInstances';
import type { DMInstanceRef } from '@cognite/reveal';

export const useFindRelated3dInstances = (
  instance: DMInstanceRef
): DMInstanceRef[] => {
  const edgeRelationData = use3dRelatedEdgeConnections(instance);
  const directRelationData = use3dRelatedDirectConnections(instance);

  return useMemo<DMInstanceRef[]>(() => {
    const edgeDirectRelationData = [
      ...(edgeRelationData.data ?? []),
      ...(directRelationData.data ?? []),
    ];
    return [instance, ...edgeDirectRelationData];
  }, [instance, edgeRelationData.data, directRelationData.data]);
};
