import { useContext } from 'react';
import { AppContext, type AppContextType } from './appContextValue';

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
