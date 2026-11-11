import type { AppState } from './types';

export const INVOICE_INTRO_AMOUNT_PLACEHOLDER = '{betrag}';

export const DEFAULT_INVOICE_INTRO = `hiermit erlaube ich mir mein Honorar von insgesamt ${INVOICE_INTRO_AMOUNT_PLACEHOLDER} wie folgt in Rechnung zu stellen:`;

export const SMALL_BUSINESS_NOTE = 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.';

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
    nextInvoiceNumber: '1',
    smallBusiness: false,
    invoiceIntro: DEFAULT_INVOICE_INTRO,
  },
};
