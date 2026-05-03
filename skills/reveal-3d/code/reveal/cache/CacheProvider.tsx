import { createContext, useContext, useMemo } from 'react';
import { AssetMappingCache } from './AssetMappingCache';

interface CacheContextValue {
  assetMappingCache: AssetMappingCache;
}

const CacheContext = createContext<CacheContextValue | null>(null);

export function useCacheContext() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCacheContext must be used within CacheProvider');
  }
  return context;
}

export function useOptionalCacheContext() {
  return useContext(CacheContext);
}

interface CacheProviderProps {
  children: React.ReactNode;
}

/**
 * Provides shared cache instances to the component tree.
 * Wrap your app or 3D viewer area with this to enable cross-navigation caching
 * (70-90% reduction in API calls on subsequent visits).
 */
export function CacheProvider({ children }: CacheProviderProps) {
  const cacheValue = useMemo(() => ({
    assetMappingCache: new AssetMappingCache(),
  }), []);

  return (
    <CacheContext.Provider value={cacheValue}>
      {children}
    </CacheContext.Provider>
  );
}
