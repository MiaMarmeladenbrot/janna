import { useReducer, useEffect, useState, useRef, type ReactNode } from 'react';
import { appReducer } from './reducer';
import { defaultState } from './defaults';
import { loadStateFromSupabase, saveStateToSupabase } from './storage';
import { useAuth } from './useAuth';
import { AppContext } from './appContextValue';

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(appReducer, defaultState);
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(0);
  const initialized = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  // Load state from Supabase when user logs in.
  // AppProvider is only mounted inside the logged-in branch in App.tsx, so
  // user is always set here — the guard is just defensive.
  useEffect(() => {
    if (!user) return;

    initialized.current = false;

    loadStateFromSupabase(user.id)
      .then((loaded) => {
        dispatch({ type: 'IMPORT_STATE', state: loaded });
        initialized.current = true;
        setLoading(false);
      })
      .catch((err) => {
        // Refuse to initialize on load failure: leaving initialized=false blocks
        // the save effect, so we won't overwrite the real Supabase row with
        // defaultState. Keep the loading spinner up so the user reloads.
        console.error('Failed to load state from Supabase:', err);
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
