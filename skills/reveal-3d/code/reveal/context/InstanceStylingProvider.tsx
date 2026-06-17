import { useRef, useCallback, type ReactNode, useMemo } from 'react';
import type { InstanceStylingGroup } from '../types';
import {
  InstanceStylingContext,
  type InstanceStylingController,
} from './instanceStylingContext';

interface InstanceStylingProviderProps {
  children: ReactNode;
}

/**
 * Provider for centralized instance styling management.
 * Components can register/unregister styling groups and listen for changes.
 */
export function InstanceStylingProvider({
  children,
}: InstanceStylingProviderProps) {
  const stylingGroupsRef = useRef<Map<string, InstanceStylingGroup>>(new Map());
  const listenersRef = useRef<Set<() => void>>(new Set());
  const nextIdRef = useRef(0);

  const getStylingGroups = useCallback(() => {
    return Array.from(stylingGroupsRef.current.values());
  }, []);

  const addEventListener = useCallback((callback: () => void): void => {
    listenersRef.current.add(callback);
    // Call once immediately to initialize with current state
    callback();
  }, []);

  const removeEventListener = useCallback((callback: () => void): void => {
    listenersRef.current.delete(callback);
  }, []);

  const notifyListeners = useCallback(() => {
    listenersRef.current.forEach((listener) => listener());
  }, []);

  const registerStylingGroup = useCallback(
    (group: InstanceStylingGroup): string => {
      const id = `styling-group-${nextIdRef.current++}`;
      stylingGroupsRef.current.set(id, group);
      notifyListeners();
      return id;
    },
    [notifyListeners]
  );

  const unregisterStylingGroup = useCallback(
    (id: string): void => {
      const deleted = stylingGroupsRef.current.delete(id);
      if (deleted) {
        notifyListeners();
      }
    },
    [notifyListeners]
  );

  const controller: InstanceStylingController = useMemo(
    () => ({
      getStylingGroups,
      addEventListener,
      removeEventListener,
      registerStylingGroup,
      unregisterStylingGroup,
    }),
    [
      getStylingGroups,
      addEventListener,
      removeEventListener,
      registerStylingGroup,
      unregisterStylingGroup,
    ]
  );

  return (
    <InstanceStylingContext.Provider value={controller}>
      {children}
    </InstanceStylingContext.Provider>
  );
}
