import type {
  Client,
  Invoice,
  InvoiceStatus,
  Project,
} from "../../store/types";
import { Card } from "../common/Card";
import { Input } from "../common/Input";
import { getEffectiveVatRate } from "../../utils/calculations";

interface InvoiceBasicsCardProps {
  invoice: Invoice;
  clients: Client[];
  clientProjects: Project[];
  smallBusiness: boolean;
  onChange: (updates: Partial<Invoice>) => void;
  onClientChange: (clientId: string) => void;
}

export function InvoiceBasicsCard({
  invoice,
  clients,
  clientProjects,
  smallBusiness,
  onChange,
  onClientChange,
}: InvoiceBasicsCardProps) {
  return (
    <Card title="Grunddaten">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Rechnungsnummer"
            value={invoice.number}
            onChange={(e) => onChange({ number: e.target.value })}
          />
          <Input
            label="Rechnungsdatum"
            type="date"
            value={invoice.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-stone-600">
            Kunde
          </label>
          <select
            value={invoice.clientId}
            onChange={(e) => onClientChange(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-stone-600">
            Projekt
          </label>
          <select
            value={invoice.projectId}
            onChange={(e) => {
              const newProj = clientProjects.find(
                (p) => p.id === e.target.value,
              );
              onChange({
                projectId: e.target.value,
                vatRate: getEffectiveVatRate(newProj, { smallBusiness }),
              });
            }}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          >
            {clientProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-stone-600">
            Status
          </label>
          <select
            value={invoice.status}
            onChange={(e) =>
              onChange({ status: e.target.value as InvoiceStatus })
            }
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="Entwurf">Entwurf</option>
            <option value="Gesendet">Gesendet</option>
            <option value="Bezahlt">Bezahlt</option>
          </select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="invoice-notes"
            className="block text-sm font-medium text-stone-600"
          >
            Hinweis auf der Rechnung (optional)
          </label>
          <textarea
            id="invoice-notes"
            value={invoice.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            rows={3}
            placeholder="z. B. Die Leistung ist Teil des vereinbarten Gesamtbudgets."
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm resize-none placeholder:text-stone-400 focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>
    </Card>
  );
}
