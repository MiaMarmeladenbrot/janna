import type { AppState, Invoice } from './types';
import { defaultState } from './defaults';
import { supabase } from '../lib/supabase';

function normalizeState(parsed: Record<string, unknown>): AppState {
  const merged: AppState = {
    ...defaultState,
    ...parsed,
    settings: { ...defaultState.settings, ...(parsed.settings as object) },
  };
  return {
    ...merged,
    invoices: merged.invoices.map((inv: Invoice) => ({ ...inv, number: String(inv.number) })),
    settings: { ...merged.settings, nextInvoiceNumber: String(merged.settings.nextInvoiceNumber) },
  };
}

// --- Supabase ---

export async function loadStateFromSupabase(userId: string): Promise<AppState> {
  const { data, error } = await supabase
    .from('app_state')
    .select('state')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    // Real fetch error (network, RLS, etc.) — refuse to proceed so the caller
    // doesn't initialize with defaultState and overwrite the real row.
    throw error;
  }

  if (!data) {
    // No row yet — fresh user.
    return defaultState;
  }

  return normalizeState(data.state as Record<string, unknown>);
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
  return normalizeState(parsed);
}
