export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  street: string;
  zip: string;
  city: string;
  salutation: string; // e.g. "Sehr geehrter Herr Dr. Vondung"
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string;
  active: boolean;
  commonTasks: string[];
  hourlyRate: number;
  weeklyTarget: number; // 28.5
  weeklyCap: number; // 1000
  vatRate: number; // 0.19
  paymentTerms: string;
}

export interface TimeEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  hours: number;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakMinutes: number;
  projectId: string;
  checkedTasks: string[];
}

export type InvoiceStatus = "Entwurf" | "Gesendet" | "Bezahlt";
export type InvoiceBillingType = "hours" | "flatrate";

export interface PositionWeek {
  year: number;
  week: number; // ISO week number 1..53
}

export interface InvoicePosition {
  id: string;
  description: string;
  billingType: InvoiceBillingType;
  // Structured period: set when the position is tied to specific calendar weeks
  // (imported hours, capped flatrate, KW-based overtime). Empty for free-text
  // periods (manual flatrates, monthly overtime).
  weeks: PositionWeek[];
  // Free-text period label, only used when `weeks` is empty.
  periodLabel?: string;
  // for hours-based
  totalHours: number;
  hourlyRate: number;
  // for flatrate
  flatAmount: number;
  // computed
  netAmount: number;
}

export interface Invoice {
  id: string;
  number: number;
  date: string; // ISO date
  clientId: string;
  projectId: string;
  positions: InvoicePosition[];
  status: InvoiceStatus;
  vatRate: number; // e.g. 0.19
  notes: string;
}

export interface OvertimeEntry {
  id: string;
  projectId: string;
  month: string; // YYYY-MM
  hours: number; // positive = credit (overtime), negative = debit (redeemed)
  source: "invoice" | "manual";
  invoiceId?: string;
  note?: string;
  // Identifies which overtime row was redeemed by an invoice debit:
  // "kw-<n>" for a calendar-week row, "manual-<entryId>" for a manual credit.
  // Used to hide already-billed rows in the invoice overtime picker.
  redeemedKey?: string;
}

export interface Settings {
  businessName: string;
  businessTitle: string;
  street: string;
  zip: string;
  city: string;
  phone: string;
  email: string;
  iban: string;
  taxNumber: string;
  nextInvoiceNumber: number;
}

export interface AppState {
  clients: Client[];
  projects: Project[];
  timeEntries: TimeEntry[];
  invoices: Invoice[];
  overtimeEntries: OvertimeEntry[];
  settings: Settings;
}
