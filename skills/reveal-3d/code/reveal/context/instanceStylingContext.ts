import { createContext } from 'react';
import type { InstanceStylingGroup } from '../types';

export interface InstanceStylingController {
  getStylingGroups: () => InstanceStylingGroup[];
  addEventListener: (callback: () => void) => void;
  removeEventListener: (callback: () => void) => void;
  registerStylingGroup: (group: InstanceStylingGroup) => string;
  unregisterStylingGroup: (id: string) => void;
}

export const InstanceStylingContext = createContext<
  InstanceStylingController | undefined
>(undefined);
