import { useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { useApp } from "../../store/AppContext";
import { getStundenKontoBalance } from "../../utils/calculations";
import { formatNumber, formatEuro } from "../../utils/currency";
import { parseMonthKey, formatMonthOnly } from "../../utils/dateFormat";

const SOURCE_LABELS: Record<string, string> = {
  cap: "Wochenlimit",
  invoice: "Rechnung",
  manual: "Manuell",
};

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatEntryMonth(month: string): string {
  const d = parseMonthKey(month);
  return capitalizeFirst(formatMonthOnly(d)) + " " + month.slice(0, 4);
}

export function StundenKonto() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [formMonth, setFormMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
  );
  const [formHours, setFormHours] = useState("");
  const [formNote, setFormNote] = useState("");

  const balance = getStundenKontoBalance(state.stundenKonto);
  const sorted = [...state.stundenKonto].sort(
    (a, b) => b.month.localeCompare(a.month) || b.id.localeCompare(a.id),
  );

  const handleAdd = () => {
    const hours = parseFloat(formHours.replace(",", "."));
    if (isNaN(hours) || hours === 0) return;
    dispatch({
      type: "ADD_STUNDEN_KONTO_ENTRIES",
      entries: [
        {
          id: crypto.randomUUID(),
          month: formMonth,
          hours,
          source: "manual",
          note: formNote || "Manuelle Buchung",
        },
      ],
    });
    setFormHours("");
    setFormNote("");
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
      {/* Header */}
      <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-stone-500" />
          <h3 className="font-semibold text-stone-800">Überstunden-Konto</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-1 text-stone-400 hover:text-stone-600 rounded"
          title="Manuelle Buchung"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Balance */}
        <div className="p-4 rounded-lg bg-stone-50 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Guthaben
            </div>
            <div
              className={`text-2xl font-bold ${balance > 0 ? "text-emerald-600" : balance < 0 ? "text-red-600" : "text-stone-400"}`}
            >
              {formatNumber(balance)} Std.
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-400">Wert</div>
            <div className="text-lg font-semibold text-stone-700">
              {formatEuro(balance * state.settings.hourlyRate)}
            </div>
          </div>
        </div>

        {/* Manual entry form */}
        {showForm && (
          <div className="p-3 rounded-lg border border-dashed border-stone-300 space-y-2">
            <div className="text-xs font-semibold text-stone-600">
              Manuelle Buchung
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="month"
                value={formMonth}
                onChange={(e) => setFormMonth(e.target.value)}
                className="rounded border border-stone-300 px-2 py-1.5 text-sm"
              />
              <input
                type="text"
                value={formHours}
                onChange={(e) => setFormHours(e.target.value)}
                placeholder="Stunden (z.B. 5 oder -3)"
                className="rounded border border-stone-300 px-2 py-1.5 text-sm"
              />
            </div>
            <input
              type="text"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="Notiz (optional)"
              className="w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="px-3 py-1 text-xs font-medium rounded bg-stone-800 text-white hover:bg-stone-700"
              >
                Buchen
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1 text-xs text-stone-500 hover:text-stone-700"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Entries */}
        <div className="space-y-1">
          {sorted.length === 0 && (
            <div className="text-sm text-stone-400 italic py-2">
              Noch keine Einträge
            </div>
          )}
          {sorted.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between py-1.5 group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${entry.hours > 0 ? "bg-emerald-500" : "bg-red-500"}`}
                />
                <span className="text-sm text-stone-600 truncate">
                  {formatEntryMonth(entry.month)}
                </span>
                <span className="text-xs text-stone-400 truncate">
                  {entry.note || SOURCE_LABELS[entry.source]}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-sm font-medium ${entry.hours > 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {entry.hours > 0 ? "+" : ""}
                  {formatNumber(entry.hours)}
                </span>
                {entry.source === "manual" && (
                  <button
                    onClick={() =>
                      dispatch({
                        type: "DELETE_STUNDEN_KONTO_ENTRY",
                        id: entry.id,
                      })
                    }
                    className="p-0.5 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Löschen"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
