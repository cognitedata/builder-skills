import { useEffect, useRef, useState } from 'react';
import { Cognite3DViewer } from '@cognite/reveal';
import type { RevealContextProps } from '../types';
import { RevealContext } from './revealContext';
import { InstanceStylingProvider } from './InstanceStylingProvider';
import { useOptionalRevealKeepAlive } from '../components/RevealKeepAlive';
import { RevealSettingsController } from '../settings/RevealSettingsController';

export function RevealProvider({
  children,
  sdk,
  color,
  viewerOptions,
}: RevealContextProps) {
  const keepAlive = useOptionalRevealKeepAlive();
  const keepAliveRef = useRef(keepAlive);
  keepAliveRef.current = keepAlive;

  const [viewerData] = useState(() => {
    const createViewer = () =>
      new Cognite3DViewer({
        sdk,
        useFlexibleCameraManager: true,
        ...viewerOptions,
      });

    const viewer = keepAlive
      ? keepAlive.getOrCreateViewer(sdk, createViewer)
      : createViewer();

    if (color) {
      viewer.setBackgroundColor({ color, alpha: 1 });
    }

    return { viewer, sdk };
  });

  useEffect(() => {
    const controller = new RevealSettingsController('medium');
    controller.applyToViewer(viewerData.viewer);
    return () => controller.dispose();
  }, [viewerData.viewer]);

  useEffect(() => {
    if (color) {
      viewerData.viewer.setBackgroundColor({ color, alpha: 1 });
    }
  }, [color, viewerData.viewer]);

  useEffect(() => {
    return () => {
      if (!keepAliveRef.current) {
        viewerData.viewer.dispose();
      }
    };
  }, []);

  return (
    <RevealContext.Provider value={viewerData}>
      <InstanceStylingProvider>{children}</InstanceStylingProvider>
    </RevealContext.Provider>
  );
}
