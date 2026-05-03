import { createContext } from 'react';
import type { Cognite3DViewer } from '@cognite/reveal';
import type { CogniteClient } from '@cognite/sdk';

export interface RevealContextValue {
  viewer: Cognite3DViewer;
  sdk: CogniteClient;
}

export const RevealContext = createContext<RevealContextValue | undefined>(
  undefined
);
