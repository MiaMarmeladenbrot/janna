import type { InvoicePosition } from "../../store/types";
import { Card } from "../../components/common/Card";
import { formatEuro } from "../../utils/currency";

interface InvoiceTotalsProps {
  positions: InvoicePosition[];
  vatRate: number;
}

export function InvoiceTotals({ positions, vatRate }: InvoiceTotalsProps) {
  const netTotal = positions.reduce((s, p) => s + p.netAmount, 0);
  const vatAmount = netTotal * vatRate;
  const grossTotal = netTotal + vatAmount;

  return (
    <Card title="Vorschau">
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-stone-600">Netto</span>
          <span className="font-medium text-stone-800">
            {formatEuro(netTotal)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-600">19% USt.</span>
          <span className="font-medium text-stone-800">
            {formatEuro(vatAmount)}
          </span>
        </div>
        <div className="flex justify-between text-sm pt-3 border-t border-stone-200">
          <span className="font-semibold text-stone-800">Gesamtbetrag</span>
          <span className="font-bold text-stone-800">
            {formatEuro(grossTotal)}
          </span>
        </div>
      </div>
    </Card>
  );
}
