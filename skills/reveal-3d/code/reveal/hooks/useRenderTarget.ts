import { useContext } from 'react';
import {
  InstanceStylingContext,
  type InstanceStylingController,
} from '../context/instanceStylingContext';

export interface RenderTarget {
  instanceStylingController: InstanceStylingController;
}

/**
 * Hook to access the render target which includes the instance styling controller.
 * This allows components to read and react to centralized styling state.
 *
 * The controller provides methods to:
 * - registerStylingGroup(group): Register a new styling group and get its ID
 * - unregisterStylingGroup(id): Remove a styling group by ID
 * - getStylingGroups(): Get all current styling groups
 * - addEventListener(callback): Subscribe to styling changes
 * - removeEventListener(callback): Unsubscribe from styling changes
 */
export function useRenderTarget(): RenderTarget {
  const stylingContext = useContext(InstanceStylingContext);
  if (!stylingContext) {
    throw new Error(
      'useRenderTarget must be used within an InstanceStylingProvider'
    );
  }
  return { instanceStylingController: stylingContext };
}
