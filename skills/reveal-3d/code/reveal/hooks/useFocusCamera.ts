import { DefaultCameraManager, type DMInstanceRef } from '@cognite/reveal';
import { useReveal } from './useReveal';
import { useCallback, useEffect } from 'react';
import { Box3, Vector3 } from 'three';
import { use3dDataForSelectedInstance } from './use3dDataForSelectedInstance';
import type { InstanceWithBoundingBox } from './useInstancesWithBoundingBoxes';

/**
 * Calculate an angled camera position for a bounding box
 * @param box - The bounding box to frame
 * @returns Camera position and target vectors
 */
function calculateAngledCameraPosition(box: Box3): {
  position: Vector3;
  target: Vector3;
} {
  // Get bounding box center and size
  const center = new Vector3();
  box.getCenter(center);

  const size = new Vector3();
  box.getSize(size);

  // Calculate the maximum dimension to determine camera distance
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = 60; // Field of view in degrees
  const cameraDistance = (maxDim / (2 * Math.tan((fov * Math.PI) / 360))) * 1.5;

  // Position camera at 45-degree angle (above and to the side)
  // Using spherical coordinates: 45° elevation, 45° azimuth
  const angle = Math.PI / 4; // 45 degrees
  const cameraPosition = new Vector3(
    center.x + cameraDistance * Math.cos(angle) * Math.cos(angle),
    center.y + cameraDistance * Math.sin(angle),
    center.z + cameraDistance * Math.cos(angle) * Math.sin(angle)
  );

  return {
    position: cameraPosition,
    target: center,
  };
}

const useFocusCameraWithInstanceBox = (
  instancesWithBoundingBox: InstanceWithBoundingBox[]
) => {
  const viewer = useReveal();

  useEffect(() => {
    if (viewer.cameraManager instanceof DefaultCameraManager) {
      viewer.cameraManager.setCameraControlsOptions({
        mouseWheelAction: 'zoomToCursor',
      });
    }
  }, [viewer.cameraManager]);

  return useCallback(() => {
    if (instancesWithBoundingBox.length === 0) {
      return;
    }

    const box = instancesWithBoundingBox.reduce(
      (unionBox, instance) => unionBox.union(instance.boundingBox),
      new Box3()
    );

    if (!box.isEmpty()) {
      const cameraState = calculateAngledCameraPosition(box);
      viewer.cameraManager.setCameraState(cameraState);
    }
  }, [instancesWithBoundingBox, viewer]);
};

export const useFocusCamera = (instance: DMInstanceRef) => {
  const selectedInstanceData = use3dDataForSelectedInstance(instance);
  return useFocusCameraWithInstanceBox(
    selectedInstanceData?.instancesWithBoxes ?? []
  );
};
