import type { Cognite3DViewer } from '@cognite/reveal';
import { useRevealContext } from './useRevealContext';

/**
 * Hook to access the Reveal viewer instance.
 * Must be used within a RevealProvider.
 */
export function useReveal(): Cognite3DViewer {
  const { viewer } = useRevealContext();
  return viewer;
}
