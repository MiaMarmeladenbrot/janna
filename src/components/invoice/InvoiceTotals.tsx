import type { Invoice } from "../../store/types";
import { Card } from "../common/Card";
import { formatEuro } from "../../utils/currency";
import { getInvoiceTotals } from "../../utils/calculations";

interface InvoiceTotalsProps {
  invoice: Invoice;
}

export function InvoiceTotals({ invoice }: InvoiceTotalsProps) {
  const { net: netTotal, vat: vatAmount, gross: grossTotal } =
    getInvoiceTotals(invoice);

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
