import type { AppState, Invoice, InvoicePosition, PositionWeek, Project } from './types';
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

// Migrate invoice positions: replace legacy `kwRange: string` with structured
// `weeks: PositionWeek[]` and free-text `periodLabel?: string`.
function migrateInvoicePositions(state: AppState): AppState {
  const needsMigration = state.invoices.some((inv) =>
    inv.positions.some((p) => (p as unknown as { weeks?: unknown }).weeks === undefined),
  );
  if (!needsMigration) return state;

  const invoices: Invoice[] = state.invoices.map((inv) => ({
    ...inv,
    positions: inv.positions.map((p) => migratePosition(p, inv.date)),
  }));

  return { ...state, invoices };
}

function migratePosition(pos: InvoicePosition, invoiceDate: string): InvoicePosition {
  const legacy = pos as unknown as { kwRange?: string; weeks?: PositionWeek[]; periodLabel?: string };
  if (Array.isArray(legacy.weeks)) {
    return { ...pos, weeks: legacy.weeks, periodLabel: legacy.periodLabel };
  }

  const raw = (legacy.kwRange ?? '').trim();
  const parsed = parseLegacyKwRange(raw, invoiceDate);

  const next: InvoicePosition = {
    id: pos.id,
    description: pos.description,
    billingType: pos.billingType,
    weeks: parsed.weeks,
    totalHours: pos.totalHours,
    hourlyRate: pos.hourlyRate,
    flatAmount: pos.flatAmount,
    netAmount: pos.netAmount,
  };
  if (parsed.weeks.length === 0 && raw !== '') {
    next.periodLabel = raw;
  }
  return next;
}

function parseLegacyKwRange(raw: string, invoiceDate: string): { weeks: PositionWeek[] } {
  if (!raw) return { weeks: [] };

  // "YYYY / KW NN" — only ever came from overtime positions (which we treat as
  // label-only, since they don't represent worked hours in that week).
  if (/^\d{4}\s*\/\s*KW\s*\d+$/i.test(raw)) {
    return { weeks: [] };
  }

  // Pure week numbers: "14", "14 und 15", "14 bis 16"
  const single = raw.match(/^(\d+)$/);
  const pair = raw.match(/^(\d+)\s+und\s+(\d+)$/);
  const range = raw.match(/^(\d+)\s+bis\s+(\d+)$/);

  if (single || pair || range) {
    const weekNumbers: number[] = single
      ? [parseInt(single[1], 10)]
      : pair
        ? [parseInt(pair[1], 10), parseInt(pair[2], 10)]
        : (() => {
            const from = parseInt(range![1], 10);
            const to = parseInt(range![2], 10);
            const out: number[] = [];
            for (let w = from; w <= to; w++) out.push(w);
            return out;
          })();

    const baseYear = invoiceDate ? parseInt(invoiceDate.slice(0, 4), 10) : new Date().getFullYear();
    const month = invoiceDate ? parseInt(invoiceDate.slice(5, 7), 10) - 1 : new Date().getMonth();

    const weeks: PositionWeek[] = weekNumbers.map((w) => ({
      year: yearForWeek(w, baseYear, month),
      week: w,
    }));
    return { weeks };
  }

  // Anything else (month names, free text) → free-text label only
  return { weeks: [] };
}

// Resolve the ISO year a given week number belongs to, given the invoice date.
// Heuristic: if the invoice is in January and the week is high (>= 52), the
// week belongs to the previous year. If it's in December and the week is 1,
// it belongs to the next year. Otherwise the invoice's own year.
function yearForWeek(week: number, baseYear: number, month: number): number {
  if (month === 0 && week >= 52) return baseYear - 1;
  if (month === 11 && week === 1) return baseYear + 1;
  return baseYear;
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
    return migrateInvoicePositions(migrateOvertimeEntries(migrateProjectTerms(merged)));
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
  return migrateInvoicePositions(migrateOvertimeEntries(migrateProjectTerms(merged)));
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
  return migrateInvoicePositions(migrateOvertimeEntries(migrateProjectTerms(merged)));
}
