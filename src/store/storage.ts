import type { AppState } from './types';
import { defaultState } from './defaults';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'janna-stundentracker';

// --- localStorage (legacy + fallback) ---

export function loadStateLocal(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);

    if (parsed.monthlyOvertime && !parsed.stundenKonto) {
      parsed.stundenKonto = parsed.monthlyOvertime.map((m: { month: string; overtime: number }) => ({
        id: crypto.randomUUID(),
        month: m.month,
        hours: m.overtime,
        source: 'manual' as const,
        note: 'Übertrag',
      }));
      delete parsed.monthlyOvertime;
    }

    return { ...defaultState, ...parsed, settings: { ...defaultState.settings, ...parsed.settings } };
  } catch {
    return defaultState;
  }
}

function saveStateLocal(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}

// --- Supabase ---

export async function loadStateFromSupabase(userId: string): Promise<AppState> {
  const { data, error } = await supabase
    .from('app_state')
    .select('state')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // No data in Supabase yet — check localStorage for migration
    const localState = loadStateLocal();
    const hasLocalData = localState.timeEntries.length > 0 || localState.invoices.length > 0;

    if (hasLocalData) {
      // Migrate localStorage data to Supabase
      await saveStateToSupabase(userId, localState);
      return localState;
    }

    // Fresh start with defaults
    return defaultState;
  }

  const parsed = data.state as Record<string, unknown>;
  return { ...defaultState, ...parsed, settings: { ...defaultState.settings, ...(parsed.settings as object) } };
}

export async function saveStateToSupabase(userId: string, state: AppState): Promise<void> {
  const { error } = await supabase
    .from('app_state')
    .upsert(
      { user_id: userId, state, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Failed to save state to Supabase:', error);
  }

  // Also keep localStorage as offline fallback
  saveStateLocal(state);
}

// --- Export / Import ---

export function exportData(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importData(json: string): AppState {
  const parsed = JSON.parse(json);
  if (!parsed.settings || !parsed.timeEntries) {
    throw new Error('Ungültige Datei');
  }
  return { ...defaultState, ...parsed, settings: { ...defaultState.settings, ...parsed.settings } };
}
