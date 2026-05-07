import { useRef, useEffect, createContext, useContext, useCallback } from 'react';
import type { Cognite3DViewer } from '@cognite/reveal';
import type { CogniteClient } from '@cognite/sdk';

interface RevealKeepAliveContextValue {
  getOrCreateViewer: (
    sdk: CogniteClient,
    createViewer: () => Cognite3DViewer
  ) => Cognite3DViewer;
  isMounted: () => boolean;
}

const RevealKeepAliveContext = createContext<RevealKeepAliveContextValue | null>(
  null
);

export function useRevealKeepAlive() {
  const context = useContext(RevealKeepAliveContext);
  if (!context) {
    throw new Error('useRevealKeepAlive must be used within RevealKeepAlive');
  }
  return context;
}

/**
 * Returns null when not inside a RevealKeepAlive provider.
 * Used by RevealProvider to conditionally reuse a kept-alive viewer.
 */
export function useOptionalRevealKeepAlive(): RevealKeepAliveContextValue | null {
  return useContext(RevealKeepAliveContext);
}

interface RevealKeepAliveProps {
  children: React.ReactNode;
}

/**
 * Keeps the Cognite3DViewer instance alive across component unmounts,
 * eliminating viewer reinitialization when navigating between assets (~2-3s saving).
 *
 * The viewer persists in a ref that survives child unmount/remount cycles.
 * Models are managed separately (added/removed as needed).
 * Disposal is deferred to survive React StrictMode's mount→unmount→remount cycle.
 */
export function RevealKeepAlive({ children }: RevealKeepAliveProps) {
  const viewerRef = useRef<Cognite3DViewer | null>(null);
  const mountedRef = useRef(false);

  const getOrCreateViewer = useCallback(
    (_sdk: CogniteClient, createViewer: () => Cognite3DViewer) => {
      if (!viewerRef.current) {
        viewerRef.current = createViewer();
      }
      return viewerRef.current;
    },
    []
  );

  const isMounted = useCallback(() => {
    return mountedRef.current;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, []);

  return (
    <RevealKeepAliveContext.Provider value={{ getOrCreateViewer, isMounted }}>
      {children}
    </RevealKeepAliveContext.Provider>
  );
}
