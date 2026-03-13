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
  note: string;
}

export type InvoiceStatus = "Entwurf" | "Gesendet" | "Bezahlt";
export type InvoiceBillingType = "hours" | "flatrate";

export interface InvoicePosition {
  id: string;
  description: string;
  billingType: InvoiceBillingType;
  // for hours-based
  kwRange: string; // e.g. "14 bis 18"
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

export interface StundenKontoEntry {
  id: string;
  month: string; // YYYY-MM
  hours: number; // positive = credit (Überstunden), negative = debit (eingelöst)
  source: "cap" | "invoice" | "manual";
  invoiceId?: string;
  note?: string;
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
  stundenKonto: StundenKontoEntry[];
  settings: Settings;
}
