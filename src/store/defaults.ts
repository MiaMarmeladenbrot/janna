import type { AppState } from './types';

export const defaultSettings: AppState['settings'] = {
  businessName: 'Janna Simone Mostert',
  businessTitle: 'MA. Konservierung und Restaurierung\nvon Holzobjekten und Historische\nAusstattungen',
  street: 'Nedlitzerstr, 15 A',
  zip: '14469',
  city: 'Potsdam',
  phone: '0049 15903765426',
  email: 'Janna.simonemostert@gmail.com',
  iban: 'DE18500105175420359774',
  taxNumber: '046/250/08188',
  hourlyRate: 35,
  weeklyTarget: 28.5,
  weeklyCap: 1000,
  vatRate: 0.19,
  nextInvoiceNumber: 182,
  paymentTerms: 'Den Rechnungsbetrag bitte innerhalb von 2 Wochen nach Rechnungsdatum überweisen.',
};

const defaultClientId = 'client-rwb';
const defaultProjectId = 'project-villa-liegnitz';

export const defaultState: AppState = {
  settings: defaultSettings,
  clients: [
    {
      id: defaultClientId,
      name: 'RestaurierungsWerkstätten Berlin GmbH',
      contactPerson: 'Dr. Matthias Vondung',
      street: 'Richterstraße 6',
      zip: '12524',
      city: 'Berlin',
      salutation: 'Sehr geehrter Herr Dr. Vondung',
    },
  ],
  projects: [
    {
      id: defaultProjectId,
      clientId: defaultClientId,
      name: 'Villa Liegnitz',
      description: 'Dokumentation, Bauleitung und Durchführung von Restauratorische Maßnahmen',
      active: true,
      commonTasks: [
        'Arbeitsplätze aufbauen',
        'Arbeiten verteilen/koordinieren',
        'Arbeitsplätze aufräumen/absaugen',
        'Bilddokumentation/Bildaufnahme',
        'Schadens Kartierung',
        'Retousche',
        'Ölen/Schleifen',
        'Bausitzung/Baubesprechung',
        'Einarbeiten/Anleiten',
        'Werkstatt/Material organisieren',
      ],
    },
  ],
  timeEntries: [],
  invoices: [],
  stundenKonto: [],
};
