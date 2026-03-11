import type { AppState, TimeEntry, Invoice, Client, Project, StundenKontoEntry, Settings } from './types';

export type AppAction =
  | { type: 'ADD_TIME_ENTRY'; entry: TimeEntry }
  | { type: 'UPDATE_TIME_ENTRY'; entry: TimeEntry }
  | { type: 'DELETE_TIME_ENTRY'; id: string }
  | { type: 'ADD_INVOICE'; invoice: Invoice }
  | { type: 'UPDATE_INVOICE'; invoice: Invoice }
  | { type: 'DELETE_INVOICE'; id: string }
  | { type: 'ADD_CLIENT'; client: Client }
  | { type: 'UPDATE_CLIENT'; client: Client }
  | { type: 'DELETE_CLIENT'; id: string }
  | { type: 'ADD_PROJECT'; project: Project }
  | { type: 'UPDATE_PROJECT'; project: Project }
  | { type: 'DELETE_PROJECT'; id: string }
  | { type: 'ADD_STUNDEN_KONTO_ENTRIES'; entries: StundenKontoEntry[] }
  | { type: 'DELETE_STUNDEN_KONTO_ENTRY'; id: string }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<Settings> }
  | { type: 'IMPORT_STATE'; state: AppState }
  | { type: 'RESET_STATE'; state: AppState };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TIME_ENTRY':
      return { ...state, timeEntries: [...state.timeEntries, action.entry] };
    case 'UPDATE_TIME_ENTRY':
      return {
        ...state,
        timeEntries: state.timeEntries.map((e) => (e.id === action.entry.id ? action.entry : e)),
      };
    case 'DELETE_TIME_ENTRY':
      return { ...state, timeEntries: state.timeEntries.filter((e) => e.id !== action.id) };
    case 'ADD_INVOICE': {
      const nextNum = Math.max(state.settings.nextInvoiceNumber, action.invoice.number + 1);
      return {
        ...state,
        invoices: [...state.invoices, action.invoice],
        settings: { ...state.settings, nextInvoiceNumber: nextNum },
      };
    }
    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map((i) => (i.id === action.invoice.id ? action.invoice : i)),
      };
    case 'DELETE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.filter((i) => i.id !== action.id),
        // Also remove linked StundenKonto entries
        stundenKonto: state.stundenKonto.filter((e) => e.invoiceId !== action.id),
      };
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.client] };
    case 'UPDATE_CLIENT':
      return { ...state, clients: state.clients.map((c) => (c.id === action.client.id ? action.client : c)) };
    case 'DELETE_CLIENT':
      return { ...state, clients: state.clients.filter((c) => c.id !== action.id) };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.project] };
    case 'UPDATE_PROJECT':
      return { ...state, projects: state.projects.map((p) => (p.id === action.project.id ? action.project : p)) };
    case 'DELETE_PROJECT':
      return { ...state, projects: state.projects.filter((p) => p.id !== action.id) };
    case 'ADD_STUNDEN_KONTO_ENTRIES':
      return { ...state, stundenKonto: [...state.stundenKonto, ...action.entries] };
    case 'DELETE_STUNDEN_KONTO_ENTRY':
      return { ...state, stundenKonto: state.stundenKonto.filter((e) => e.id !== action.id) };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'IMPORT_STATE':
      return action.state;
    case 'RESET_STATE':
      return action.state;
    default:
      return state;
  }
}
