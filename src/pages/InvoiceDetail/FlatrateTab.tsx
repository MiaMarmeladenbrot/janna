import { useState } from "react";
import type { InvoicePosition } from "../../store/types";
import { Input } from "../../components/common/Input";
import { NumberInput } from "../../components/common/NumberInput";
import { Button } from "../../components/common/Button";
import { formatEuro } from "../../utils/currency";
import { buildFlatratePosition } from "../../utils/invoiceBuilders";

interface FlatrateTabProps {
  descriptionPlaceholder?: string;
  onAdd: (position: InvoicePosition) => void;
}

export function FlatrateTab({ descriptionPlaceholder, onAdd }: FlatrateTabProps) {
  const [description, setDescription] = useState("");
  const [kwRange, setKwRange] = useState("");
  const [amount, setAmount] = useState(0);

  const handleAdd = () => {
    const pos = buildFlatratePosition(description, kwRange, amount);
    if (!pos) return;
    onAdd(pos);
    setDescription("");
    setKwRange("");
    setAmount(0);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-stone-500">
          Beschreibung
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm resize-none focus:border-stone-500 focus:outline-none"
          placeholder={descriptionPlaceholder || "Leistungsbeschreibung..."}
        />
      </div>
      <Input
        label="Zeitraum (KW)"
        value={kwRange}
        onChange={(e) => setKwRange(e.target.value)}
        placeholder="z.B. 14 und 15"
      />
      <NumberInput
        label="Pauschalbetrag (€)"
        value={amount}
        onValueChange={setAmount}
        decimals={2}
      />
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-stone-700">
          Netto: {formatEuro(amount)}
        </div>
        <Button variant="primary" size="sm" onClick={handleAdd}>
          Übernehmen
        </Button>
      </div>
    </div>
  );
}
