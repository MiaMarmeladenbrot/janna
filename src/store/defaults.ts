import type { AppState } from './types';

export const defaultState: AppState = {
  clients: [],
  projects: [],
  timeEntries: [],
  invoices: [],
  overtimeEntries: [],
  settings: {
    businessName: '',
    businessTitle: '',
    street: '',
    zip: '',
    city: '',
    phone: '',
    email: '',
    iban: '',
    taxNumber: '',
    nextInvoiceNumber: 1,
  },
};
