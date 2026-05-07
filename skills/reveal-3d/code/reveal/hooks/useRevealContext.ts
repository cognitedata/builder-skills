import { useContext } from 'react';
import {
  RevealContext,
  type RevealContextValue,
} from '../context/revealContext';

export function useRevealContext(): RevealContextValue {
  const context = useContext(RevealContext);
  if (context === undefined) {
    throw new Error('useRevealContext must be used within a RevealProvider');
  }
  return context;
}
