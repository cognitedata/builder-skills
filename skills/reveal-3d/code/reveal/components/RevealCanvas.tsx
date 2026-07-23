import { type ReactNode, type ReactElement, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRevealContext } from '../hooks/useRevealContext';

export function RevealCanvas({
  children,
}: {
  children?: ReactNode;
}): ReactElement {
  const { viewer } = useRevealContext();
  const parentElement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = parentElement.current;
    if (parent !== null) {
      parent.appendChild(viewer.domElement);
    }
    return () => {
      if (parent !== null && parent.contains(viewer.domElement)) {
        parent.removeChild(viewer.domElement);
      }
    };
  }, [viewer]);

  return (
    <div
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
      ref={parentElement}
    >
      {createPortal(children, viewer.domElement)}
    </div>
  );
}
