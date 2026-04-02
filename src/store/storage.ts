import type { AppState, Project } from './types';
import { defaultState } from './defaults';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'janna-stundentracker';

// Migrate overtime entries: add projectId, drop legacy "cap" entries
function migrateOvertimeEntries(state: AppState): AppState {
  let entries = state.overtimeEntries.filter((e: any) => e.source !== 'cap');

  const needsProjectId = entries.some((e) => !e.projectId);
  if (!needsProjectId && entries.length === state.overtimeEntries.length) return state;

  if (needsProjectId) {
    const fallbackProjectId = state.projects[0]?.id || '';
    entries = entries.map((e) => {
      if (e.projectId) return e;
      const linkedInvoice = e.invoiceId ? state.invoices.find((i) => i.id === e.invoiceId) : null;
      return { ...e, projectId: linkedInvoice?.projectId || fallbackProjectId };
    });
  }

  return { ...state, overtimeEntries: entries };
}

// Migrate projects that don't have billing terms yet (moved from Settings to Project)
function migrateProjectTerms(state: AppState): AppState {
  const oldSettings = state.settings as unknown as Record<string, unknown>;
  const needsMigration = state.projects.some((p) => p.hourlyRate === undefined);
  if (!needsMigration) return state;

  const projects = state.projects.map((p): Project => ({
    ...p,
    hourlyRate: p.hourlyRate ?? (oldSettings.hourlyRate as number) ?? 35,
    weeklyTarget: p.weeklyTarget ?? (oldSettings.weeklyTarget as number) ?? 28.5,
    weeklyCap: p.weeklyCap ?? (oldSettings.weeklyCap as number) ?? 1000,
    vatRate: p.vatRate ?? (oldSettings.vatRate as number) ?? 0.19,
    paymentTerms: p.paymentTerms ?? (oldSettings.paymentTerms as string) ?? 'Den Rechnungsbetrag bitte innerhalb von 2 Wochen nach Rechnungsdatum überweisen.',
  }));

  return { ...state, projects };
}

// --- localStorage (legacy + fallback) ---

export function loadStateLocal(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);

    const merged = { ...defaultState, ...parsed, settings: { ...defaultState.settings, ...parsed.settings } };
    return migrateOvertimeEntries(migrateProjectTerms(merged));
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
  const merged = { ...defaultState, ...parsed, settings: { ...defaultState.settings, ...(parsed.settings as object) } };
  return migrateOvertimeEntries(migrateProjectTerms(merged));
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
  const merged = { ...defaultState, ...parsed, settings: { ...defaultState.settings, ...parsed.settings } };
  return migrateOvertimeEntries(migrateProjectTerms(merged));
}
