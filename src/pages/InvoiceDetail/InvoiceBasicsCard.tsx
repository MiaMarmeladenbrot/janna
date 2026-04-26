import type {
  Client,
  Invoice,
  InvoiceStatus,
  Project,
} from "../../store/types";
import { Card } from "../../components/common/Card";
import { Input } from "../../components/common/Input";
import { NumberInput } from "../../components/common/NumberInput";

interface InvoiceBasicsCardProps {
  invoice: Invoice;
  clients: Client[];
  clientProjects: Project[];
  onChange: (updates: Partial<Invoice>) => void;
  onClientChange: (clientId: string) => void;
}

export function InvoiceBasicsCard({
  invoice,
  clients,
  clientProjects,
  onChange,
  onClientChange,
}: InvoiceBasicsCardProps) {
  return (
    <Card title="Grunddaten">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <NumberInput
            label="Rechnungsnummer"
            value={invoice.number}
            onValueChange={(v) => onChange({ number: v })}
            decimals={0}
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
                vatRate: newProj?.vatRate ?? 0.19,
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
      </div>
    </Card>
  );
}
