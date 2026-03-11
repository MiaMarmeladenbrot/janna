import { createContext, useContext, useReducer, useEffect, useState, useRef, type ReactNode } from 'react';
import type { AppState } from './types';
import { appReducer, type AppAction } from './reducer';
import { defaultState } from './defaults';
import { loadStateFromSupabase, saveStateToSupabase } from './storage';
import { useAuth } from './AuthContext';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  loading: boolean;
  lastSaved: number;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(appReducer, defaultState);
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(0);
  const initialized = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  // Load state from Supabase when user logs in
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    initialized.current = false;
    setLoading(true);

    loadStateFromSupabase(user.id).then((loaded) => {
      dispatch({ type: 'IMPORT_STATE', state: loaded });
      initialized.current = true;
      setLoading(false);
    });
  }, [user]);

  // Save state to Supabase on changes (debounced)
  useEffect(() => {
    if (!user || !initialized.current) return;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveStateToSupabase(user.id, state).then(() => {
        setLastSaved(Date.now());
      });
    }, 500);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [state, user]);

  return (
    <AppContext.Provider value={{ state, dispatch, loading, lastSaved }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
