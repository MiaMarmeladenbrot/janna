import { Trash2 } from "lucide-react";
import type { InvoicePosition } from "../../store/types";
import { Input } from "../../components/common/Input";
import { NumberInput } from "../../components/common/NumberInput";
import { formatEuro } from "../../utils/currency";
import { formatPeriod } from "../../utils/period";

interface PositionItemProps {
  pos: InvoicePosition;
  index: number;
  isOvertime: boolean;
  descriptionPlaceholder?: string;
  onUpdate: (updates: Partial<InvoicePosition>) => void;
  onRemove: () => void;
}

export function PositionItem({
  pos,
  index,
  isOvertime,
  descriptionPlaceholder,
  onUpdate,
  onRemove,
}: PositionItemProps) {
  const hasStructuredWeeks = (pos.weeks?.length ?? 0) > 0;

  return (
    <div
      className={`p-3 rounded-lg space-y-2 ${
        isOvertime
          ? "bg-emerald-50 border border-emerald-200"
          : "bg-stone-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-stone-700">
            Position {index + 1}
          </span>
          <span
            className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
              isOvertime
                ? "bg-emerald-100 text-emerald-700"
                : "bg-stone-200 text-stone-600"
            }`}
          >
            {isOvertime
              ? "Überstunden"
              : pos.billingType === "hours"
                ? "Stunden"
                : "Pauschal"}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="p-1 text-stone-400 hover:text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-stone-500">
          Beschreibung
        </label>
        <textarea
          value={pos.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm resize-none focus:border-stone-500 focus:outline-none"
          placeholder={descriptionPlaceholder || "Leistungsbeschreibung..."}
        />
      </div>

      {hasStructuredWeeks ? (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-stone-500">
            Zeitraum (KW)
          </label>
          <div className="px-3 py-2 text-sm text-stone-700 bg-stone-100 rounded-lg border border-stone-200">
            {formatPeriod(pos)}
          </div>
        </div>
      ) : (
        <Input
          label="Zeitraum (KW)"
          value={pos.periodLabel ?? ""}
          onChange={(e) => onUpdate({ periodLabel: e.target.value })}
          placeholder="z.B. 14 und 15"
        />
      )}

      {pos.billingType === "hours" ? (
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="Stunden"
            value={pos.totalHours}
            onValueChange={(v) => onUpdate({ totalHours: v })}
          />
          <NumberInput
            label="Stundensatz (€)"
            value={pos.hourlyRate}
            onValueChange={(v) => onUpdate({ hourlyRate: v })}
            decimals={2}
          />
        </div>
      ) : (
        <NumberInput
          label="Pauschalbetrag (€)"
          value={pos.flatAmount}
          onValueChange={(v) => onUpdate({ flatAmount: v })}
          decimals={2}
        />
      )}

      <div className="text-right text-sm font-medium text-stone-700">
        Netto: {formatEuro(pos.netAmount)}
      </div>
    </div>
  );
}
